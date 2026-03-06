import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { Camera, Users, CheckCircle, XCircle, Loader, RefreshCw, Play, Square, AlertCircle, UserPlus } from 'lucide-react';

function CameraAttendance({ user }) {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [attendanceMarked, setAttendanceMarked] = useState([]);
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [faceDescriptors, setFaceDescriptors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeringStudent, setRegisteringStudent] = useState(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects] = useState(['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8']);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const markingInProgressRef = useRef(new Set()); // Prevent concurrent marking for same student
  const alreadyMarkedRef = useRef(new Set()); // Track students already marked this session

  // Load stored face descriptors from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('faceDescriptors');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const descriptors = {};
        for (const [studentId, arr] of Object.entries(parsed)) {
          descriptors[studentId] = new Float32Array(arr);
        }
        setFaceDescriptors(descriptors);
      } catch (e) {
        console.error('Error loading face descriptors:', e);
      }
    }
  }, []);

  // Build face matcher when descriptors or students change
  const buildFaceMatcher = useCallback(() => {
    try {
      const labeledDescriptors = [];
      
      students.forEach(student => {
        const descriptor = faceDescriptors[student.id];
        if (descriptor) {
          labeledDescriptors.push(
            new faceapi.LabeledFaceDescriptors(
              `${student.id}|${student.firstName} ${student.lastName}`,
              [descriptor]
            )
          );
        }
      });
      
      if (labeledDescriptors.length > 0) {
        const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        setFaceMatcher(matcher);
        console.log(`Face matcher built with ${labeledDescriptors.length} registered faces`);
      }
    } catch (error) {
      console.error('Error building face matcher:', error);
    }
  }, [students, faceDescriptors]);

  useEffect(() => {
    if (Object.keys(faceDescriptors).length > 0 && students.length > 0 && modelsLoaded) {
      buildFaceMatcher();
    }
  }, [faceDescriptors, students, modelsLoaded, buildFaceMatcher]);

  // Get teacher's assigned classes
  useEffect(() => {
    if (user.role === 'TEACHER' && user.assignedClasses) {
      const classArray = user.assignedClasses.split(',').map(c => c.trim()).filter(c => c);
      setClasses(classArray);
      if (classArray.length > 0) {
        setSelectedClass(classArray[0]);
      }
    } else if (user.role === 'ADMIN') {
      axios.get('http://localhost:8080/api/manage/students')
        .then(res => {
          const uniqueClasses = [...new Set(res.data.map(s => s.className))].filter(c => c);
          setClasses(uniqueClasses);
          if (uniqueClasses.length > 0) {
            setSelectedClass(uniqueClasses[0]);
          }
        })
        .catch(err => console.error('Error fetching classes:', err));
    }
  }, [user]);

  // Load students for selected class
  useEffect(() => {
    if (selectedClass) {
      axios.get(`http://localhost:8080/api/manage/students?className=${selectedClass}`)
        .then(res => {
          setStudents(res.data);
        })
        .catch(err => console.error('Error fetching students:', err));
    }
  }, [selectedClass]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ]);
        
        setModelsLoaded(true);
        setMessage('Face detection models loaded successfully!');
      } catch (error) {
        console.error('Error loading models:', error);
        setMessage('Error loading face detection models. Please refresh the page.');
      } finally {
        setLoadingModels(false);
      }
    };
    
    loadModels();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [stopCamera]);

  // Generate unique session ID based on date, class, and subject
  const generateSessionId = useCallback(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const classCode = selectedClass.replace(/\s+/g, '');
    const subjectCode = selectedSubject.replace(/\s+/g, '');
    // Create a numeric hash from the combination
    const combined = `${dateStr}${classCode}${subjectCode}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [selectedClass, selectedSubject]);

  // Mark student as present
  const markStudentPresent = useCallback(async (student, confidence = 100) => {
    const studentId = student.id;
    
    // SYNCHRONOUS checks - must all pass before proceeding
    // Check if already marked using ref (instant check, not dependent on state)
    if (alreadyMarkedRef.current.has(studentId)) {
      return; // Already marked permanently
    }
    if (markingInProgressRef.current.has(studentId)) {
      return; // Currently being processed
    }
    
    // Only mark students from the selected class
    if (student.className !== selectedClass) {
      return; // Wrong class
    }
    
    // IMMEDIATELY add to in-progress BEFORE any async work
    markingInProgressRef.current.add(studentId);
    // Also add to already marked immediately to prevent any further attempts
    alreadyMarkedRef.current.add(studentId);
    
    const sessionId = generateSessionId();
    const subjectName = selectedSubject || user.subject || 'General';
    
    try {
      const response = await axios.post('http://localhost:8080/api/attendance/manual-mark', {
        studentId: studentId,
        sessionId: sessionId,
        status: 'PRESENT',
        subject: `${selectedClass} - ${subjectName}`
      });
      
      // Only add to UI list if not already marked (backend returns "Already marked" if duplicate)
      if (response.data !== "Already marked") {
        setAttendanceMarked(prev => {
          // Double check to prevent duplicates in state
          if (prev.find(a => a.id === studentId)) return prev;
          return [...prev, { 
            ...student, 
            markedAt: new Date().toLocaleTimeString(),
            confidence 
          }];
        });
        
        setMessage(`✅ ${student.firstName} ${student.lastName} marked present for ${selectedClass} - ${subjectName}! (${confidence}% confidence)`);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      // On error, remove from both refs so it can be retried
      markingInProgressRef.current.delete(studentId);
      alreadyMarkedRef.current.delete(studentId);
    } finally {
      // Remove from in-progress (but keep in alreadyMarked)
      markingInProgressRef.current.delete(studentId);
    }
  }, [selectedClass, selectedSubject, user.subject, generateSessionId]);

  // Face detection and recognition
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState !== 4) return;
    
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    
    try {
      const detections = await faceapi.detectAllFaces(
        video, 
        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptors();
      
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      setDetectedFaces(resizedDetections);
      const recognized = [];
      
      resizedDetections.forEach((detection) => {
        const box = detection.detection.box;
        
        if (faceMatcher && detection.descriptor) {
          const match = faceMatcher.findBestMatch(detection.descriptor);
          
          if (match.label !== 'unknown') {
            const [studentId, studentName] = match.label.split('|');
            const student = students.find(s => s.id === parseInt(studentId));
            
            // Green box for recognized face
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            // Name label
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(box.x, box.y - 30, box.width, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(studentName, box.x + 5, box.y - 10);
            
            const confidence = Math.round((1 - match.distance) * 100);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(`${confidence}% match`, box.x + 5, box.y + box.height + 15);
            
            if (student && student.className === selectedClass) {
              recognized.push({ student, confidence, distance: match.distance });
              
              // Only attempt to mark if not already in our refs
              if (confidence > 50 && !alreadyMarkedRef.current.has(student.id)) {
                markStudentPresent(student, confidence);
              }
            }
          } else {
            // Red box for unknown face
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(box.x, box.y - 25, 100, 25);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText('Unknown', box.x + 5, box.y - 7);
          }
        } else {
          // Blue box when no matcher
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
      });
      
      setRecognizedStudents(recognized);
      
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [modelsLoaded, faceMatcher, students, selectedClass, markStudentPresent]);

  // Register face for a student
  const registerFace = async (student) => {
    if (!modelsLoaded) {
      setMessage('Models not loaded yet. Please wait.');
      return;
    }
    
    setRegisteringStudent(student);
    setIsRegistering(true);
    setMessage(`Look at the camera to register face for ${student.firstName}...`);
    
    await startCamera();
    
    setTimeout(async () => {
      try {
        const video = videoRef.current;
        if (!video || video.readyState !== 4) {
          setMessage('Camera not ready. Please try again.');
          setIsRegistering(false);
          return;
        }
        
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.SsdMobilenetv1Options()
        ).withFaceLandmarks().withFaceDescriptor();
        
        if (detection) {
          const descriptor = detection.descriptor;
          
          const newDescriptors = { ...faceDescriptors, [student.id]: descriptor };
          setFaceDescriptors(newDescriptors);
          
          const toStore = {};
          for (const [id, desc] of Object.entries(newDescriptors)) {
            toStore[id] = Array.from(desc);
          }
          localStorage.setItem('faceDescriptors', JSON.stringify(toStore));
          
          setMessage(`✅ Face registered for ${student.firstName} ${student.lastName}!`);
          
          setTimeout(() => buildFaceMatcher(), 500);
        } else {
          setMessage('❌ No face detected. Please look directly at the camera and try again.');
        }
      } catch (error) {
        console.error('Error registering face:', error);
        setMessage('Error registering face. Please try again.');
      } finally {
        setIsRegistering(false);
        setRegisteringStudent(null);
        stopCamera();
      }
    }, 2000);
  };

  // Start scanning
  const startScanning = async () => {
    if (!selectedClass) {
      setMessage('Please select a class first');
      return;
    }
    
    if (!selectedSubject) {
      setMessage('Please select a period/subject first');
      return;
    }
    
    // Clear tracking refs for new session
    alreadyMarkedRef.current.clear();
    markingInProgressRef.current.clear();
    
    const registeredCount = students.filter(s => faceDescriptors[s.id]).length;
    if (registeredCount === 0) {
      setMessage('⚠️ No faces registered for this class. Please register student faces first.');
    }
    
    // Load existing attendance for this session
    const sessionId = generateSessionId();
    try {
      const response = await axios.get(`http://localhost:8080/api/attendance/session/${sessionId}`);
      const existingRecords = response.data || [];
      
      // Pre-populate attendanceMarked with students already marked in this session
      const alreadyMarked = [];
      existingRecords.forEach(record => {
        const student = students.find(s => s.id === record.student?.id);
        if (student) {
          alreadyMarked.push({
            ...student,
            markedAt: new Date(record.timestamp).toLocaleTimeString(),
            confidence: 100
          });
          // Also add to ref to prevent duplicate API calls
          alreadyMarkedRef.current.add(student.id);
        }
      });
      
      if (alreadyMarked.length > 0) {
        setAttendanceMarked(alreadyMarked);
        setMessage(`📋 Loaded ${alreadyMarked.length} already marked students for this session.`);
      } else {
        setAttendanceMarked([]);
      }
    } catch (error) {
      console.log('No existing attendance found for this session');
      setAttendanceMarked([]);
    }
    
    // Clear marking in progress ref (but NOT alreadyMarkedRef)
    markingInProgressRef.current.clear();
    
    await startCamera();
    setIsScanning(true);
    
    // Slower interval (500ms) to prevent race conditions
    scanIntervalRef.current = setInterval(() => {
      detectFaces();
    }, 500);
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    stopCamera();
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setMessage(`Scanning stopped. ${attendanceMarked.length} students marked present.`);
    setRecognizedStudents([]);
  };

  const getRegisteredCount = () => {
    return students.filter(s => faceDescriptors[s.id]).length;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Face Recognition Attendance</h2>
          </div>
          {isScanning && selectedClass && selectedSubject && (
            <div className="bg-purple-100 px-4 py-2 rounded-lg">
              <span className="text-sm text-purple-700 font-medium">
                📚 {selectedClass} | {selectedSubject} | {new Date().toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {loadingModels && (
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading face recognition models...</span>
          </div>
        )}
        
        {cameraError && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{cameraError}</span>
          </div>
        )}
        
        {message && !cameraError && (
          <div className={`p-3 rounded mb-4 ${message.includes('❌') || message.includes('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
        
        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Registered Faces: </span>
            <span className="font-bold text-blue-600">{getRegisteredCount()}/{students.length}</span>
          </div>
          {faceMatcher && (
            <div className="bg-green-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Face Matcher: </span>
              <span className="font-bold text-green-600">Ready ✓</span>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="border rounded-lg px-4 py-2 w-48"
              disabled={isScanning}
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Period</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="border rounded-lg px-4 py-2 w-48"
              disabled={isScanning}
            >
              <option value="">Choose period...</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={!modelsLoaded || !selectedClass || !selectedSubject}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              <Play className="w-5 h-5" />
              Start Recognition
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 mt-6"
            >
              <Square className="w-5 h-5" />
              Stop Scanning
            </button>
          )}
          
          <button
            onClick={() => setAttendanceMarked([])}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 mt-6"
          >
            <RefreshCw className="w-5 h-5" />
            Reset
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera View */}
        <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Camera Feed
            {recognizedStudents.length > 0 && (
              <span className="ml-2 text-sm text-green-600">
                ({recognizedStudents.length} identified)
              </span>
            )}
          </h3>
          
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                if (canvasRef.current && videoRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth;
                  canvasRef.current.height = videoRef.current.videoHeight;
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            
            {!isScanning && !isRegistering && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80">
                <div className="text-center text-white">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Camera is off</p>
                  <p className="text-sm text-gray-400">Click "Start Recognition" to begin</p>
                </div>
              </div>
            )}
            
            {isRegistering && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-900 bg-opacity-70">
                <div className="text-center text-white">
                  <Loader className="w-16 h-16 mx-auto mb-4 animate-spin" />
                  <p className="text-lg">Registering face for {registeringStudent?.firstName}...</p>
                  <p className="text-sm text-blue-200">Look directly at the camera</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Detection Stats */}
          <div className="mt-4 flex gap-4">
            <div className="bg-blue-50 rounded-lg p-3 flex-1 text-center">
              <p className="text-2xl font-bold text-blue-600">{detectedFaces.length}</p>
              <p className="text-sm text-gray-600">Faces Detected</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 flex-1 text-center">
              <p className="text-2xl font-bold text-purple-600">{recognizedStudents.length}</p>
              <p className="text-sm text-gray-600">Identified</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 flex-1 text-center">
              <p className="text-2xl font-bold text-green-600">{attendanceMarked.length}</p>
              <p className="text-sm text-gray-600">Marked Present</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 flex-1 text-center">
              <p className="text-2xl font-bold text-orange-600">{students.length - attendanceMarked.length}</p>
              <p className="text-sm text-gray-600">Remaining</p>
            </div>
          </div>
        </div>
        
        {/* Student List */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Students ({selectedClass})
          </h3>
          
          <div className="text-xs text-gray-500 mb-3 p-2 bg-yellow-50 rounded">
            💡 Click "Register Face" to capture student face for recognition
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No students in this class</p>
            ) : (
              students.map(student => {
                const isMarked = attendanceMarked.find(a => a.id === student.id);
                const hasRegisteredFace = !!faceDescriptors[student.id];
                const isCurrentlyRecognized = recognizedStudents.find(r => r.student.id === student.id);
                
                return (
                  <div 
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isMarked ? 'bg-green-50 border-green-200' : 
                      isCurrentlyRecognized ? 'bg-blue-50 border-blue-300 animate-pulse' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isMarked ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">
                          {student.firstName} {student.lastName}
                          {isCurrentlyRecognized && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                              LIVE {isCurrentlyRecognized.confidence}%
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Roll: {student.rollNumber}
                          {hasRegisteredFace && <span className="ml-2 text-green-600">• Face ✓</span>}
                          {isMarked && ` • ${isMarked.markedAt}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!hasRegisteredFace && (
                        <button
                          onClick={() => registerFace(student)}
                          disabled={isRegistering || isScanning}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Register Face
                        </button>
                      )}
                      {hasRegisteredFace && !isMarked && (
                        <button
                          onClick={() => markStudentPresent(student, 100)}
                          className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                        >
                          Manual
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {attendanceMarked.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{attendanceMarked.length}</span> of{' '}
                <span className="font-semibold">{students.length}</span> students marked present
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraAttendance;

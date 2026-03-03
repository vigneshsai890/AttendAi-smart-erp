from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import os
import requests
import scan_faces  # Import functionality from your existing script

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
API_URL = "http://localhost:8080/api/attendance/mark"
SESSION_ID = 1  # Default session for uploads
# Re-use the known faces logic from scan_faces
known_faces = scan_faces.load_known_faces()

mp_face_mesh = mp.solutions.face_mesh

@app.route('/process-class-photo', methods=['POST'])
def process_class_photo():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # 1. Read the image file into OpenCV format
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        # 2. Process with MediaPipe
        # Note: static_image_mode=True is important for photos
        identified_students = []
        
        with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=100,  # Allow many faces in one class photo
            refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face_mesh:
            
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(image_rgb)
            
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # Get embedding
                    curr_emb = scan_faces.get_face_embedding(face_landmarks.landmark)
                    
                    if curr_emb is not None:
                        # Find match
                        match_id, dist = scan_faces.find_best_match(curr_emb, known_faces)
                        
                        if match_id:
                            # Mark Attendance
                            try:
                                payload = {
                                    "faceEncodingId": match_id,
                                    "sessionId": SESSION_ID,
                                    "attentionScore": 100.0, # Assumed 100 for static photo
                                    "isDrowsy": False
                                }
                                # Send to Spring Boot
                                response = requests.post(API_URL, json=payload, timeout=2.0)
                                status = "Success" if response.status_code == 200 else f"Failed ({response.status_code})"
                                identified_students.append({
                                    "id": match_id,
                                    "confidence": float(dist),
                                    "status": status
                                })
                            except Exception as e:
                                identified_students.append({
                                    "id": match_id,
                                    "error": str(e)
                                })

        return jsonify({
            "message": f"Processed {len(identified_students)} students.",
            "students": identified_students
        })

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting AI Server on port 5000...")
    # Refresh known faces on startup
    if not known_faces:
        print("Reloading faces...")
        known_faces = scan_faces.load_known_faces()
    
    app.run(port=5000, debug=True)

package com.smartclass.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartclass.dto.AttendanceRequest;
import com.smartclass.model.AttendanceRecord;
import com.smartclass.model.Student;
import com.smartclass.repository.AttendanceRepository;
import com.smartclass.repository.StudentRepository;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@RequestBody AttendanceRequest request) {
        Optional<Student> studentOpt = studentRepository.findByFaceEncodingId(request.getFaceEncodingId());
        
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student not found for face encoding: " + request.getFaceEncodingId());
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setStudent(studentOpt.get());
        record.setSessionId(request.getSessionId());
        // Simple logic: if sessionId > 1000, it's a timestamp+subject_code, but for MVP we might just store subject
        // For now, let's assume subject is passed or default
        // IMPORTANT: Python script needs to send subject or we default it?
        // Let's add subject to DTO or infer. For now, set Default or leave null.
        
        record.setTimestamp(LocalDateTime.now());
        record.setStatus("PRESENT");
        record.setAttentionScore(request.getAttentionScore());
        record.setIsDrowsy(request.getIsDrowsy());

        attendanceRepository.save(record);
        
        return ResponseEntity.ok("Attendance marked successfully for " + studentOpt.get().getFirstName());
    }

    // Manual Attendance (Teacher overrides)
    @PostMapping("/manual-mark")
    public ResponseEntity<?> manualAttendance(@RequestBody ManualAttendanceDTO dto) {
        Optional<Student> studentOpt = studentRepository.findById(dto.getStudentId());
        if (studentOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        // Check if attendance already marked for this student in this session
        if (attendanceRepository.existsByStudentIdAndSessionId(dto.getStudentId(), dto.getSessionId())) {
            return ResponseEntity.ok("Already marked");
        }
        
        AttendanceRecord record = new AttendanceRecord();
        record.setStudent(studentOpt.get());
        record.setSessionId(dto.getSessionId()); 
        record.setSubject(dto.getSubject());
        record.setTimestamp(LocalDateTime.now());
        record.setStatus(dto.getStatus()); // PRESENT, ABSENT, etc.
        record.setAttentionScore(100.0); // Manual entry assumes full attention or N/A
        record.setIsDrowsy(false);
        
        attendanceRepository.save(record);
        return ResponseEntity.ok("Manual attendance marked.");
    }
    
    public static class ManualAttendanceDTO {
        private Long studentId;
        private Long sessionId;
        private String subject;
        private String status;
        
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long id) { studentId = id; }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long s) { sessionId = s; }
        public String getSubject() { return subject; }
        public void setSubject(String s) { subject = s; }
        public String getStatus() { return status; }
        public void setStatus(String s) { status = s; }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceBySession(
            @PathVariable Long sessionId,
            @RequestParam(required = false) String subject) {
        List<AttendanceRecord> records;
        if (subject != null && !subject.isEmpty()) {
            records = attendanceRepository.findBySessionIdAndSubject(sessionId, subject);
        } else {
            records = attendanceRepository.findBySessionId(sessionId);
        }
        
        // Return only unique students (first record per student)
        java.util.Map<Long, AttendanceRecord> uniqueByStudent = new java.util.LinkedHashMap<>();
        for (AttendanceRecord record : records) {
            Long studentId = record.getStudent().getId();
            if (!uniqueByStudent.containsKey(studentId)) {
                uniqueByStudent.put(studentId, record);
            }
        }
        
        return ResponseEntity.ok(new java.util.ArrayList<>(uniqueByStudent.values()));
    }
    
    // Clean up duplicate attendance records
    @DeleteMapping("/cleanup-duplicates/{sessionId}")
    public ResponseEntity<?> cleanupDuplicates(@PathVariable Long sessionId) {
        List<AttendanceRecord> records = attendanceRepository.findBySessionId(sessionId);
        
        java.util.Set<Long> seenStudents = new java.util.HashSet<>();
        java.util.List<Long> duplicateIds = new java.util.ArrayList<>();
        
        for (AttendanceRecord record : records) {
            Long studentId = record.getStudent().getId();
            if (seenStudents.contains(studentId)) {
                duplicateIds.add(record.getId());
            } else {
                seenStudents.add(studentId);
            }
        }
        
        for (Long id : duplicateIds) {
            attendanceRepository.deleteById(id);
        }
        
        return ResponseEntity.ok("Deleted " + duplicateIds.size() + " duplicate records");
    }
    
    // Get attendance by subject only (for teacher dashboard)
    @GetMapping("/by-subject")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceBySubject(@RequestParam String subject) {
        List<AttendanceRecord> records = attendanceRepository.findBySubject(subject);
        return ResponseEntity.ok(records);
    }
    
    // API to get attendance for a specific student for the student dashboard
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceRecord>> getStudentAttendance(@PathVariable Long studentId) {
        List<AttendanceRecord> allRecords = attendanceRepository.findAll();
        List<AttendanceRecord> studentRecords = allRecords.stream()
            .filter(r -> r.getStudent().getId().equals(studentId))
            .collect(Collectors.toList());
        return ResponseEntity.ok(studentRecords);
    }
}

package com.smartclass.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.smartclass.model.Role;
import com.smartclass.model.Student;
import com.smartclass.model.User;
import com.smartclass.repository.StudentRepository;
import com.smartclass.repository.UserRepository;

@RestController
@RequestMapping("/api/manage")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper DTOs for cleaner API
    public static class TeacherDTO {
        private String username;
        private String password;
        private String subject;
        private String assignedClasses; // e.g., "10-A, 10-B"

        // Getters Setters
        public String getUsername() { return username; }
        public void setUsername(String u) { username = u; }
        public String getPassword() { return password; }
        public void setPassword(String p) { password = p; }
        public String getSubject() { return subject; }
        public void setSubject(String s) { subject = s; }
        public String getAssignedClasses() { return assignedClasses; }
        public void setAssignedClasses(String c) { assignedClasses = c; }
    }

    public static class StudentDTO {
        private String rollNumber;
        private String firstName;
        private String lastName;
        private String email;
        private String className;
        private String faceEncodingId;
        private String username;
        private String password;
        
        // Getters Setters
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String r) { rollNumber = r; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String f) { firstName = f; }
        public String getLastName() { return lastName; }
        public void setLastName(String l) { lastName = l; }
        public String getEmail() { return email; }
        public void setEmail(String e) { email = e; }
        public String getClassName() { return className; }
        public void setClassName(String c) { className = c; }
        public String getFaceEncodingId() { return faceEncodingId; }
        public void setFaceEncodingId(String f) { faceEncodingId = f; }
        public String getUsername() { return username; }
        public void setUsername(String u) { username = u; }
        public String getPassword() { return password; }
        public void setPassword(String p) { password = p; }
    }

    // Admin/College: Add a new student + User account (using DTO)
    @PostMapping("/add-student")
    public ResponseEntity<?> addStudent(@RequestBody StudentDTO studentDto) {
        // Validation (basic)
        if (studentRepository.findByRollNumber(studentDto.getRollNumber()).isPresent()) {
            return ResponseEntity.badRequest().body("Roll number already exists!");
        }

        Student student = new Student();
        student.setRollNumber(studentDto.getRollNumber());
        student.setFirstName(studentDto.getFirstName());
        if (studentDto.getLastName() != null) student.setLastName(studentDto.getLastName());
        if (studentDto.getEmail() != null) student.setEmail(studentDto.getEmail());
        if (studentDto.getClassName() != null) student.setClassName(studentDto.getClassName());
        
        // Auto-generate face ID if missing
        if (studentDto.getFaceEncodingId() == null || studentDto.getFaceEncodingId().isEmpty()) {
            student.setFaceEncodingId("face_" + studentDto.getRollNumber()); 
        } else {
            student.setFaceEncodingId(studentDto.getFaceEncodingId());
        }
        
        // Save Student
        Student savedStudent = studentRepository.save(student);

        // Create User account (Check if username provided, else duplicate check on rollNo)
        String usernameToUse = (studentDto.getUsername() != null && !studentDto.getUsername().isEmpty()) 
                               ? studentDto.getUsername() 
                               : savedStudent.getRollNumber();
        
        if (userRepository.findByUsername(usernameToUse).isPresent()) {
             // If manual username exists, fallback? Or just log warn. 
             // Ideally we should warn before creating student, but rollNumber was unique check above.
        } else {
            User user = new User();
            user.setUsername(usernameToUse);
            // Use provided password or default
            String pwdToUse = (studentDto.getPassword() != null && !studentDto.getPassword().isEmpty())
                              ? studentDto.getPassword()
                              : "password123";
            user.setPassword(pwdToUse); 
            user.setRole(Role.STUDENT);
            user.setStudentProfile(savedStudent);
            userRepository.save(user);
        }

        return ResponseEntity.ok(savedStudent);
    }

    
    // Teacher/Admin can list all students (optionally filter by className)
    @GetMapping("/students")
    public Iterable<Student> getAllStudents(@RequestParam(required = false) String className) {
        if (className != null && !className.isEmpty()) {
            return studentRepository.findByClassName(className);
        }
        return studentRepository.findAll();
    }

    // Admin/Teacher: Upload photo for facial recognition training
    @PostMapping("/upload-photo/{studentId}")
    public ResponseEntity<?> uploadPhoto(@PathVariable Long studentId, @RequestParam("file") MultipartFile file) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            // Updated Path to relative or absolute as per env
            // Ensure this folder exists: f:\Face\ai_module\known_faces\
            String uploadDir = "f:/Face/ai_module/known_faces/";
            String fileName = studentOpt.get().getFaceEncodingId() + ".jpg";
            Path path = Paths.get(uploadDir, fileName); // Use safe path joining
            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            
            return ResponseEntity.ok("Photo uploaded successfully for " + studentOpt.get().getFirstName());
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to upload photo: " + e.getMessage());
        }
    }
    
    // College Admin View: Get Overall Stats
    @GetMapping("/college-stats")
    public ResponseEntity<?> getCollegeStats() {
        long totalStudents = studentRepository.count();
        long totalUsers = userRepository.count();
        return ResponseEntity.ok("Total Students: " + totalStudents + ", Total Users: " + totalUsers);
    }
    
    // UPDATE Student
    @PutMapping("/update-student/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Student studentDetails) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Student student = studentOpt.get();
        // Update fields (only if provided)
        if (studentDetails.getFirstName() != null) student.setFirstName(studentDetails.getFirstName());
        if (studentDetails.getLastName() != null) student.setLastName(studentDetails.getLastName());
        if (studentDetails.getRollNumber() != null) student.setRollNumber(studentDetails.getRollNumber());
        if (studentDetails.getEmail() != null) student.setEmail(studentDetails.getEmail());
        if (studentDetails.getClassName() != null) student.setClassName(studentDetails.getClassName());
        
        // Note: We avoid changing Face ID lightly as it breaks file links
        
        Student updatedStudent = studentRepository.save(student);
        return ResponseEntity.ok(updatedStudent);
    }

    // DELETE Student
    @DeleteMapping("/delete-student/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // 1. Delete associated User account first (cleanup)
        // (Assuming simple logic: Find user by rollNumber/username)
        // Ideally we should have a cascade setup, but manual is safer here
        Optional<User> userOpt = userRepository.findByUsername(studentOpt.get().getRollNumber());
        if (userOpt.isPresent()) {
            userRepository.delete(userOpt.get());
        }

        // 2. Delete the Student
        studentRepository.delete(studentOpt.get());
        
        // 3. Optional: Delete the face photo file?
        try {
             String uploadDir = "f:/Face/ai_module/known_faces/";
             String fileName = studentOpt.get().getFaceEncodingId() + ".jpg";
             Path path = Paths.get(uploadDir, fileName);
             Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Could not delete photo file: " + e.getMessage());
        }

        return ResponseEntity.ok("Student deleted successfully.");
    }

    // -------------------------------------------------------------------------
    // TEACHER MANAGEMENT
    // -------------------------------------------------------------------------

    // Get all Teachers
    @GetMapping("/teachers")
    public Iterable<User> getAllTeachers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.TEACHER)
                .toList();
    }

    // Admin: Add Teacher
    @PostMapping("/add-teacher")
    public ResponseEntity<?> addTeacher(@RequestBody TeacherDTO teacherDto) {
        if (userRepository.findByUsername(teacherDto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists!");
        }

        User user = new User();
        user.setUsername(teacherDto.getUsername());
        user.setPassword(teacherDto.getPassword()); // In real app, encrypt!
        user.setRole(Role.TEACHER);
        user.setSubject(teacherDto.getSubject());
        user.setAssignedClasses(teacherDto.getAssignedClasses());
        
        userRepository.save(user);
        
        return ResponseEntity.ok("Teacher account created for " + teacherDto.getUsername());
    }

    // Admin: Update Teacher
    @PutMapping("/update-teacher/{id}")
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @RequestBody TeacherDTO teacherDto) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty() || userOpt.get().getRole() != Role.TEACHER) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        if (teacherDto.getUsername() != null && !teacherDto.getUsername().isEmpty()) user.setUsername(teacherDto.getUsername());
        if (teacherDto.getPassword() != null && !teacherDto.getPassword().isEmpty()) user.setPassword(teacherDto.getPassword());
        if (teacherDto.getSubject() != null) user.setSubject(teacherDto.getSubject());
        if (teacherDto.getAssignedClasses() != null) user.setAssignedClasses(teacherDto.getAssignedClasses());
        
        userRepository.save(user);
        return ResponseEntity.ok("Teacher updated successfully.");
    }

    // Admin: Delete Teacher
    @DeleteMapping("/delete-teacher/{id}")
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty() || userOpt.get().getRole() != Role.TEACHER) {
            return ResponseEntity.notFound().build();
        }
        userRepository.delete(userOpt.get());
        return ResponseEntity.ok("Teacher deleted successfully.");
    }
}


package com.smartclass.controller;

import com.smartclass.dto.LoginRequest;
import com.smartclass.model.User;
import com.smartclass.model.Role;
import com.smartclass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // In a real app, use BCrypt! Simple check for demo:
            if (user.getPassword().equals(request.getPassword())) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    // Admin: Create Teacher
    @PostMapping("/register-teacher")
    public ResponseEntity<?> registerTeacher(@RequestBody TeacherDTO teacherDto) {
        if (userRepository.findByUsername(teacherDto.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists!");
        }

        User user = new User();
        user.setUsername(teacherDto.getUsername());
        user.setPassword(teacherDto.getPassword()); 
        user.setRole(Role.TEACHER);
        user.setSubject(teacherDto.getSubject());
        
        userRepository.save(user);
        
        return ResponseEntity.ok("Teacher account created for " + teacherDto.getUsername());
    }

    public static class TeacherDTO {
        private String username;
        private String password;
        private String subject;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
    }
}

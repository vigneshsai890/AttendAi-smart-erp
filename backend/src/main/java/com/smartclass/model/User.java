package com.smartclass.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;
    
    private String password; 
    
    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToOne
    @JoinColumn(name = "student_id")
    private Student studentProfile;
    
    private String subject; 
    private String assignedClasses;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    
    public Student getStudentProfile() { return studentProfile; }
    public void setStudentProfile(Student studentProfile) { this.studentProfile = studentProfile; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getAssignedClasses() { return assignedClasses; }
    public void setAssignedClasses(String assignedClasses) { this.assignedClasses = assignedClasses; }
}

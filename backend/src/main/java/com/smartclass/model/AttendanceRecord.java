package com.smartclass.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    private Long sessionId;
    private LocalDateTime timestamp;
    private String status;
    private Double attentionScore;
    private Boolean isDrowsy;
    private String subject;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Double getAttentionScore() { return attentionScore; }
    public void setAttentionScore(Double attentionScore) { this.attentionScore = attentionScore; }
    
    public Boolean getIsDrowsy() { return isDrowsy; }
    public void setIsDrowsy(Boolean isDrowsy) { this.isDrowsy = isDrowsy; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
}

package com.smartclass.dto;

public class AttendanceRequest {
    private String faceEncodingId;
    private Long sessionId;
    private Double attentionScore;
    private Boolean isDrowsy;

    public String getFaceEncodingId() { return faceEncodingId; }
    public void setFaceEncodingId(String faceEncodingId) { this.faceEncodingId = faceEncodingId; }
    
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    
    public Double getAttentionScore() { return attentionScore; }
    public void setAttentionScore(Double attentionScore) { this.attentionScore = attentionScore; }
    
    public Boolean getIsDrowsy() { return isDrowsy; }
    public void setIsDrowsy(Boolean isDrowsy) { this.isDrowsy = isDrowsy; }
}

package com.smartclass.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartclass.model.AttendanceRecord;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);
    List<AttendanceRecord> findBySubject(String subject);
    List<AttendanceRecord> findBySessionIdAndSubject(Long sessionId, String subject);
    boolean existsByStudentIdAndSessionId(Long studentId, Long sessionId);
    List<AttendanceRecord> findByStudentId(Long studentId);
}

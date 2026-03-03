package com.smartclass.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartclass.model.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByFaceEncodingId(String faceEncodingId);
    Optional<Student> findByRollNumber(String rollNumber);
    List<Student> findByClassName(String className);
}

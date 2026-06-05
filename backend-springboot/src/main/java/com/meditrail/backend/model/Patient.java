package com.meditrail.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String uid;           // Firebase UID (LCksxhL3czSGcyxlFArb728xa2M2)

    @Column(unique = true, nullable = false)
    private String email;         // somnathnachann@gmail.com

    @Column(unique = true, nullable = false)
    private String phoneNumber;   // 9356199931

    private String name;          // Somnath Nachan

    private String gender;        // Male

    private Integer age;          // 21

    private String role;          // patient

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

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
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String uid;              // Firebase UID (Nz6g8SKOozLuzBO85a8Jncl3mV93)

    @Column(unique = true, nullable = false)
    private String email;            // avi543naik@gmail.com

    private String name;             // Avinash Naik

    @Column(unique = true, nullable = false)
    private String licenseNumber;    // DHSDB3432

    private String specialization;  // Eye specialist

    private String role;             // doctor

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

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
@Table(name = "medical_files")
public class MedicalFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String patientUid;       // Firebase UID of patient

    @Column(nullable = false)
    private String doctorUid;        // Firebase UID of doctor

    @Column(nullable = false)
    private String fileName;         // original file name

    @Column(nullable = false)
    private String s3FilePath;       // S3 bucket path/key

    private String fileType;         // PDF, JPG, PNG etc

    private Long fileSize;           // file size in bytes

    private String description;      // optional note by doctor

    private String doctorName;       // added

    private String patientName;      // added

    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}

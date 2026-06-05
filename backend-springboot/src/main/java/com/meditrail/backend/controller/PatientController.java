package com.meditrail.backend.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.meditrail.backend.model.Patient;
import com.meditrail.backend.service.MailService;
import com.meditrail.backend.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    private final MailService mailService;

    // Register new patient
    @PostMapping("/register")
    public ResponseEntity<?> registerPatient(@RequestBody Patient patient) {
        try {
            Patient saved = patientService.savePatient(patient);
            // Send welcome email
            if (saved.getEmail() != null) {
                mailService.sendPatientWelcomeEmail(
                saved.getEmail(),
                saved.getName(),
                saved.getUid()
            );
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    // Get patient by UID
    @GetMapping("/{uid}")
    public ResponseEntity<?> getPatient(@PathVariable String uid) {
        Optional<Patient> patient = patientService.getPatientByUid(uid);
        if (patient.isPresent()) {
            return ResponseEntity.ok(patient.get());
        }
        return ResponseEntity.notFound().build();
    }

    // Get patient files
    @GetMapping("/{uid}/files")
    public ResponseEntity<?> getPatientFiles(@PathVariable String uid) {
        return ResponseEntity.ok(patientService.getPatientByUid(uid));
    }

    // Update patient profile in postgres
    @PutMapping("/update")
    public ResponseEntity<?> updatePatient(@RequestBody Patient patient) {
        try {
            Optional<Patient> existingOpt = patientService.getPatientByUid(patient.getUid());
            if (!existingOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            Patient existing = existingOpt.get();
            if (patient.getName() != null) {
                existing.setName(patient.getName());
            }
            if (patient.getPhoneNumber() != null) {
                existing.setPhoneNumber(patient.getPhoneNumber());
            }
            Patient updated = patientService.savePatient(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Update failed: " + e.getMessage());
        }
    }
}

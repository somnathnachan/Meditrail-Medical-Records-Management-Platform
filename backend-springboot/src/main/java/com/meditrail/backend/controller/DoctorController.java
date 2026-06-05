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

import com.meditrail.backend.dto.PatientSearchRequest;
import com.meditrail.backend.model.Doctor;
import com.meditrail.backend.model.Patient;
import com.meditrail.backend.service.DoctorService;
import com.meditrail.backend.service.MailService;
import com.meditrail.backend.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctor")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final PatientService patientService;

    private final MailService mailService;

    // Register new doctor
    @PostMapping("/register")
    public ResponseEntity<?> registerDoctor(@RequestBody Doctor doctor) {
        try {
            if (doctorService.isLicenseNumberValid(doctor.getLicenseNumber())) {
                return ResponseEntity.badRequest().body("License number already registered!");
            }
        Doctor saved = doctorService.saveDoctor(doctor);
        // Send welcome email
        if (saved.getEmail() != null) {
                mailService.sendDoctorWelcomeEmail(
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
    
    // Get doctor by UID
    @GetMapping("/{uid}")
    public ResponseEntity<?> getDoctor(@PathVariable String uid) {
        Optional<Doctor> doctor = doctorService.getDoctorByUid(uid);
        if (doctor.isPresent()) {
            return ResponseEntity.ok(doctor.get());
        }
        return ResponseEntity.notFound().build();
    }

    // Search patient
    @PostMapping("/search-patient")
    public ResponseEntity<?> searchPatient(@RequestBody PatientSearchRequest request) {
        Optional<Patient> patient = patientService.searchPatient(request);
        if (patient.isPresent()) {
            return ResponseEntity.ok(patient.get());
        }
        return ResponseEntity.notFound().build();
    }

    // Update doctor profile in postgres
    @PutMapping("/update")
    public ResponseEntity<?> updateDoctor(@RequestBody Doctor doctor) {
        try {
            Optional<Doctor> existingOpt = doctorService.getDoctorByUid(doctor.getUid());
            if (!existingOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            Doctor existing = existingOpt.get();
            if (doctor.getName() != null) {
                existing.setName(doctor.getName());
            }
            if (doctor.getSpecialization() != null) {
                existing.setSpecialization(doctor.getSpecialization());
            }
            Doctor updated = doctorService.saveDoctor(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Update failed: " + e.getMessage());
        }
    }
}

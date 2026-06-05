package com.meditrail.backend.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.meditrail.backend.dto.PatientSearchRequest;
import com.meditrail.backend.model.Patient;
import com.meditrail.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public Optional<Patient> searchPatient(PatientSearchRequest request) {
        if (request.getUid() != null && !request.getUid().isEmpty()) {
            return patientRepository.findByUid(request.getUid());
        } else if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            return patientRepository.findByEmail(request.getEmail());
        } else if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            return patientRepository.findByPhoneNumber(request.getPhoneNumber());
        }
        return Optional.empty();
    }

    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public Optional<Patient> getPatientByUid(String uid) {
        return patientRepository.findByUid(uid);
    }
}

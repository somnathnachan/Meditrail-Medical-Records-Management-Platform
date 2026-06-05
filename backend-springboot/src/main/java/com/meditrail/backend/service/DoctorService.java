package com.meditrail.backend.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.meditrail.backend.model.Doctor;
import com.meditrail.backend.repository.DoctorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public Optional<Doctor> getDoctorByUid(String uid) {
        return doctorRepository.findByUid(uid);
    }

    public Optional<Doctor> getDoctorByEmail(String email) {
        return doctorRepository.findByEmail(email);
    }

    public boolean isLicenseNumberValid(String licenseNumber) {
        return doctorRepository.findByLicenseNumber(licenseNumber).isPresent();
    }
}

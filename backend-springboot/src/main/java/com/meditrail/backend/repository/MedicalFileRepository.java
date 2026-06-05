package com.meditrail.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.meditrail.backend.model.MedicalFile;

@Repository
public interface MedicalFileRepository extends JpaRepository<MedicalFile, Long> {

    List<MedicalFile> findByPatientUidOrderByUploadedAtDesc(String patientUid);

    List<MedicalFile> findByDoctorUid(String doctorUid);
}

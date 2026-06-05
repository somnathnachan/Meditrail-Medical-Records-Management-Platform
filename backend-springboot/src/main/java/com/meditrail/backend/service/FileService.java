package com.meditrail.backend.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.meditrail.backend.model.MedicalFile;
import com.meditrail.backend.repository.MedicalFileRepository;
import com.meditrail.backend.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileService {

    //@Autowired
    //import org.springframework.beans.factory.annotation.Autowired;
    
    private final MedicalFileRepository medicalFileRepository;
    private final S3Service s3Service;

    private final MailService mailService;
    private final PatientRepository patientRepository;

    // Allowed file types
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    public MedicalFile uploadFile(MultipartFile file, String patientUid,
            String doctorUid, String doctorName,
            String patientName, String description) {

        // Step 1 - Validate file type
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Only PDF, JPG, JPEG, PNG files are allowed!");
        }

        // Step 2 - Upload to S3
        String s3Path = s3Service.uploadFile(file, patientUid);

        // Step 3 - Save metadata to database
        MedicalFile medicalFile = new MedicalFile();
        medicalFile.setPatientUid(patientUid);
        medicalFile.setDoctorUid(doctorUid);
        medicalFile.setDoctorName(doctorName);
        medicalFile.setPatientName(patientName);
        medicalFile.setFileName(file.getOriginalFilename());
        medicalFile.setS3FilePath(s3Path);
        medicalFile.setFileType(file.getContentType());
        medicalFile.setFileSize(file.getSize());
        medicalFile.setDescription(description);

       MedicalFile saved = medicalFileRepository.save(medicalFile); // ← save first

        //Send email notification
        try {
        patientRepository.findByUid(patientUid).ifPresent(patient -> {
            if (patient.getEmail() != null) {
                String date = LocalDate.now()
                .format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
                mailService.sendUploadNotificationEmail(
                patient.getEmail(),
                patient.getName(),
                doctorName,
                description,
                date
                );
            }
        });
        } catch (Exception e) {
            System.out.println("Email notification failed: " + e.getMessage());
            }

        return saved;
    }

    public List<MedicalFile> getPatientFiles(String patientUid) {
        return medicalFileRepository.findByPatientUidOrderByUploadedAtDesc(patientUid);
    }

    public List<MedicalFile> getDoctorHistory(String doctorUid) {
        return medicalFileRepository.findByDoctorUid(doctorUid);
    }

    public String generateDownloadUrl(Long fileId) {
        MedicalFile file = medicalFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));
        return s3Service.generatePresignedUrl(file.getS3FilePath());
    }
}

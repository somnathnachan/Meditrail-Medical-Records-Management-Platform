package com.meditrail.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.meditrail.backend.dto.FileUploadResponse;
import com.meditrail.backend.model.MedicalFile;
import com.meditrail.backend.model.Patient;
import com.meditrail.backend.service.FileService;
import com.meditrail.backend.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final PatientService patientService;

    // Doctor uploads file to patient account
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientUid") String patientUid,
            @RequestParam("doctorUid") String doctorUid,
            @RequestParam("doctorName") String doctorName,
            @RequestParam("description") String description) {
        try {
            // Get patient name
            Optional<Patient> patient = patientService.getPatientByUid(patientUid);
            if (!patient.isPresent()) {
                return ResponseEntity.badRequest().body("Patient not found!");
            }

            String patientName = patient.get().getName();

            MedicalFile savedFile = fileService.uploadFile(
                    file, patientUid, doctorUid,
                    doctorName, patientName, description
            );

            FileUploadResponse response = new FileUploadResponse(
                    savedFile.getFileName(),
                    savedFile.getS3FilePath(),
                    savedFile.getFileType(),
                    savedFile.getFileSize(),
                    savedFile.getPatientUid(),
                    savedFile.getPatientName(),
                    savedFile.getDoctorUid(),
                    savedFile.getDoctorName(),
                    savedFile.getDescription(),
                    "File uploaded successfully!",
                    true
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    // Get all files for patient dashboard
    @GetMapping("/patient/{patientUid}")
    public ResponseEntity<?> getPatientFiles(@PathVariable String patientUid) {
        List<MedicalFile> files = fileService.getPatientFiles(patientUid);
        return ResponseEntity.ok(files);
    }

    // Get doctor upload history
    @GetMapping("/doctor/{doctorUid}/history")
    public ResponseEntity<?> getDoctorHistory(@PathVariable String doctorUid) {
        List<MedicalFile> files = fileService.getDoctorHistory(doctorUid);
        return ResponseEntity.ok(files);
    }

    // Generate secure download URL
    @GetMapping("/download/{fileId}")
    public ResponseEntity<?> getDownloadUrl(@PathVariable Long fileId) {
        try {
            String url = fileService.generateDownloadUrl(fileId);
            return ResponseEntity.ok(url);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("File not found!");
        }
    }
}

package com.meditrail.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FileUploadResponse {

    private String fileName;
    private String s3FilePath;
    private String fileType;
    private Long fileSize;
    private String patientUid;
    private String patientName;      //added
    private String doctorUid;
    private String doctorName;       //added
    private String description;
    private String message;
    private boolean success;
}

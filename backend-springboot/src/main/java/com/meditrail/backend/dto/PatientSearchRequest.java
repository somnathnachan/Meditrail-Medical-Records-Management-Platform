package com.meditrail.backend.dto;

import lombok.Data;

@Data
public class PatientSearchRequest {

    //three method to search patient
    private String uid;
    private String email;
    private String phoneNumber;
}

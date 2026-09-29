package com.example.healthcare.dto;

import com.example.healthcare.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Identifies the logged-in user and, if applicable, the id of the
 * Patient or Doctor profile linked to their account. The frontend
 * uses this to know "which patient/doctor am I" after login.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {
    private String email;
    private Role role;
    private String name;
    private Long patientId;
    private Long doctorId;
}

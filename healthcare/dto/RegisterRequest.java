package com.example.healthcare.dto;

import com.example.healthcare.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Phone is required")
    private String phone;

    /** Only PATIENT or DOCTOR can self-register. ADMIN accounts are seeded by the system. */
    @NotNull(message = "Role is required")
    private Role role;

    // Optional, used only when role = DOCTOR
    private String specialization;
    private String qualification;
    private String availableDays;
}

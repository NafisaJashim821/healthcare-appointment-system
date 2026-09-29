package com.example.healthcare.controller;

import com.example.healthcare.dto.ApiResponse;
import com.example.healthcare.dto.AppointmentResponse;
import com.example.healthcare.dto.DoctorRequest;
import com.example.healthcare.dto.DoctorResponse;
import com.example.healthcare.service.AppointmentService;
import com.example.healthcare.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Doctor management endpoints")
public class DoctorController {

    private final DoctorService doctorService;
    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a doctor record (ADMIN only)")
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(@Valid @RequestBody DoctorRequest request) {
        DoctorResponse response = doctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all doctors")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctors() {
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully", doctorService.getAllDoctors()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a doctor by id")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Doctor fetched successfully", doctorService.getDoctorById(id)));
    }

    @GetMapping("/specialization/{specialization}")
    @Operation(summary = "Search doctors by specialization")
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> searchBySpecialization(@PathVariable String specialization) {
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully",
                doctorService.searchBySpecialization(specialization)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Update a doctor's details")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(@PathVariable Long id,
                                                                     @Valid @RequestBody DoctorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully",
                doctorService.updateDoctor(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a doctor (ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor deleted successfully"));
    }

    @GetMapping("/{id}/appointments")
    @Operation(summary = "View a doctor's appointments")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorAppointments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Appointments fetched successfully",
                appointmentService.getAppointmentsByDoctor(id)));
    }
}

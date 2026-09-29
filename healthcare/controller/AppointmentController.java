package com.example.healthcare.controller;

import com.example.healthcare.dto.ApiResponse;
import com.example.healthcare.dto.AppointmentRequest;
import com.example.healthcare.dto.AppointmentResponse;
import com.example.healthcare.dto.AppointmentStatusUpdateRequest;
import com.example.healthcare.service.AppointmentService;
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
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment booking and management endpoints")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    @Operation(summary = "Book a new appointment", description = "Rejects the booking if the doctor already has an appointment at that date/time, or if the date/time is in the past.")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(@Valid @RequestBody AppointmentRequest request) {
        AppointmentResponse response = appointmentService.bookAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booked successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Get all appointments (ADMIN, DOCTOR)")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAllAppointments() {
        return ResponseEntity.ok(ApiResponse.success("Appointments fetched successfully",
                appointmentService.getAllAppointments()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an appointment by id")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Appointment fetched successfully",
                appointmentService.getAppointmentById(id)));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get all appointments for a given patient")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Appointments fetched successfully",
                appointmentService.getAppointmentsByPatient(patientId)));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get all appointments for a given doctor")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ApiResponse.success("Appointments fetched successfully",
                appointmentService.getAppointmentsByDoctor(doctorId)));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled successfully",
                appointmentService.cancelAppointment(id)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    @Operation(summary = "Update an appointment's status (ADMIN, DOCTOR)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(@PathVariable Long id,
                                                                          @Valid @RequestBody AppointmentStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Appointment status updated successfully",
                appointmentService.updateStatus(id, request.getStatus())));
    }
}

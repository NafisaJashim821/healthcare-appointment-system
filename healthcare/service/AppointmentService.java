package com.example.healthcare.service;

import com.example.healthcare.dto.AppointmentRequest;
import com.example.healthcare.dto.AppointmentResponse;
import com.example.healthcare.entity.Appointment;
import com.example.healthcare.entity.AppointmentStatus;
import com.example.healthcare.entity.Doctor;
import com.example.healthcare.entity.Patient;
import com.example.healthcare.exception.AppointmentConflictException;
import com.example.healthcare.exception.BadRequestException;
import com.example.healthcare.exception.ResourceNotFoundException;
import com.example.healthcare.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientService patientService;
    private final DoctorService doctorService;

    @Transactional
    public AppointmentResponse bookAppointment(AppointmentRequest request) {
        Patient patient = patientService.findEntityById(request.getPatientId());
        Doctor doctor = doctorService.findEntityById(request.getDoctorId());

        LocalDateTime requestedDateTime = LocalDateTime.of(request.getAppointmentDate(), request.getAppointmentTime());
        if (requestedDateTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book an appointment in the past");
        }

        boolean doctorAlreadyBooked = appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                        doctor.getId(), request.getAppointmentDate(), request.getAppointmentTime(),
                        AppointmentStatus.CANCELLED);

        if (doctorAlreadyBooked) {
            throw new AppointmentConflictException("Doctor is already booked for this time.");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .reason(request.getReason())
                .status(AppointmentStatus.BOOKED)
                .build();

        return toResponse(appointmentRepository.save(appointment));
    }

    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    public AppointmentResponse getAppointmentById(Long id) {
        return toResponse(findEntityById(id));
    }

    public Appointment findEntityById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + id));
    }

    public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {
        // ensures a 404 is raised if the patient does not exist
        patientService.findEntityById(patientId);
        return appointmentRepository.findByPatientId(patientId).stream().map(this::toResponse).toList();
    }

    public List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId) {
        doctorService.findEntityById(doctorId);
        return appointmentRepository.findByDoctorId(doctorId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long id) {
        Appointment appointment = findEntityById(id);
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("A completed appointment cannot be cancelled");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse updateStatus(Long id, AppointmentStatus status) {
        Appointment appointment = findEntityById(id);
        appointment.setStatus(status);
        return toResponse(appointmentRepository.save(appointment));
    }

    public long countToday() {
        return appointmentRepository.countByAppointmentDate(LocalDate.now());
    }

    public long countByStatus(AppointmentStatus status) {
        return appointmentRepository.countByStatus(status);
    }

    public long countAll() {
        return appointmentRepository.count();
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getName())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getName())
                .doctorSpecialization(appointment.getDoctor().getSpecialization())
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentTime(appointment.getAppointmentTime())
                .reason(appointment.getReason())
                .status(appointment.getStatus())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}

package com.example.healthcare.service;

import com.example.healthcare.dto.DashboardResponse;
import com.example.healthcare.entity.AppointmentStatus;
import com.example.healthcare.repository.DoctorRepository;
import com.example.healthcare.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentService appointmentService;

    public DashboardResponse getDashboard() {
        return DashboardResponse.builder()
                .totalPatients(patientRepository.count())
                .totalDoctors(doctorRepository.count())
                .totalAppointments(appointmentService.countAll())
                .todayAppointments(appointmentService.countToday())
                .completedAppointments(appointmentService.countByStatus(AppointmentStatus.COMPLETED))
                .cancelledAppointments(appointmentService.countByStatus(AppointmentStatus.CANCELLED))
                .build();
    }
}

package com.example.healthcare.service;

import com.example.healthcare.dto.DoctorRequest;
import com.example.healthcare.dto.DoctorResponse;
import com.example.healthcare.entity.Doctor;
import com.example.healthcare.exception.BadRequestException;
import com.example.healthcare.exception.ResourceNotFoundException;
import com.example.healthcare.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;

    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (doctorRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A doctor with this email already exists");
        }
        Doctor doctor = Doctor.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .specialization(request.getSpecialization())
                .qualification(request.getQualification())
                .availableDays(request.getAvailableDays())
                .build();
        return toResponse(doctorRepository.save(doctor));
    }

    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll().stream().map(this::toResponse).toList();
    }

    public DoctorResponse getDoctorById(Long id) {
        return toResponse(findEntityById(id));
    }

    public Doctor findEntityById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
    }

    public List<DoctorResponse> searchBySpecialization(String specialization) {
        return doctorRepository.findBySpecializationIgnoreCaseContaining(specialization)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = findEntityById(id);
        doctor.setName(request.getName());
        doctor.setEmail(request.getEmail());
        doctor.setPhone(request.getPhone());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setAvailableDays(request.getAvailableDays());
        return toResponse(doctorRepository.save(doctor));
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = findEntityById(id);
        doctorRepository.delete(doctor);
    }

    private DoctorResponse toResponse(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .specialization(doctor.getSpecialization())
                .qualification(doctor.getQualification())
                .availableDays(doctor.getAvailableDays())
                .build();
    }
}

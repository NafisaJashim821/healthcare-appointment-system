package com.example.healthcare.service;

import com.example.healthcare.dto.LoginRequest;
import com.example.healthcare.dto.LoginResponse;
import com.example.healthcare.dto.MeResponse;
import com.example.healthcare.dto.RegisterRequest;
import com.example.healthcare.entity.Doctor;
import com.example.healthcare.entity.Patient;
import com.example.healthcare.entity.Role;
import com.example.healthcare.entity.User;
import com.example.healthcare.exception.BadRequestException;
import com.example.healthcare.exception.ResourceNotFoundException;
import com.example.healthcare.repository.DoctorRepository;
import com.example.healthcare.repository.PatientRepository;
import com.example.healthcare.repository.UserRepository;
import com.example.healthcare.security.JwtUtil;
import com.example.healthcare.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created through self-registration");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        user = userRepository.save(user);

        if (request.getRole() == Role.PATIENT) {
            if (patientRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("A patient profile with this email already exists");
            }
            Patient patient = Patient.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .user(user)
                    .build();
            patientRepository.save(patient);
        } else if (request.getRole() == Role.DOCTOR) {
            if (doctorRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("A doctor profile with this email already exists");
            }
            Doctor doctor = Doctor.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .specialization(request.getSpecialization() != null ? request.getSpecialization() : "General Medicine")
                    .qualification(request.getQualification())
                    .availableDays(request.getAvailableDays())
                    .user(user)
                    .build();
            doctorRepository.save(doctor);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new LoginResponse(token, "Bearer", user.getEmail(), user.getRole());
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new LoginResponse(token, "Bearer", user.getEmail(), user.getRole());
    }

    /**
     * Resolves the currently authenticated user to their Patient/Doctor profile id,
     * so the frontend knows which record "belongs" to the logged-in account.
     */
    public MeResponse getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        if (email == null) {
            throw new BadRequestException("No authenticated user in context");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        MeResponse.MeResponseBuilder builder = MeResponse.builder()
                .email(user.getEmail())
                .role(user.getRole());

        if (user.getRole() == Role.PATIENT) {
            patientRepository.findByEmail(email).ifPresent(p -> {
                builder.patientId(p.getId());
                builder.name(p.getName());
            });
        } else if (user.getRole() == Role.DOCTOR) {
            doctorRepository.findByEmail(email).ifPresent(d -> {
                builder.doctorId(d.getId());
                builder.name(d.getName());
            });
        }

        return builder.build();
    }
}

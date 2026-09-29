# HealthCare Appointment Management System

A backend REST API for managing patients, doctors, and appointments, built with **Java 17** and **Spring Boot 3**.

> Built as a portfolio project for a Junior Java Developer application at **Square Health Ltd.** (Dhaka, Bangladesh).
> This project uses dummy/sample data only — it does not store or process any real patient medical records.

---

## 1. Project Overview

The system lets a clinic manage:
- **Users** with role-based access (`ADMIN`, `DOCTOR`, `PATIENT`), secured with JWT.
- **Patients** and **Doctors** as separate managed profiles.
- **Appointments** booked by patients with doctors, with automatic **double-booking conflict detection** and **past-date rejection**.
- An **Admin dashboard** summarizing system-wide statistics.

## 2. Features

- User registration & login (BCrypt + JWT)
- Role-based authorization (`ADMIN`, `DOCTOR`, `PATIENT`)
- Full CRUD for Patients and Doctors
- Doctor search by specialization
- Appointment booking with:
  - Conflict detection ("Doctor is already booked for this time.")
  - Past-date/time rejection
- Appointment status lifecycle: `BOOKED → COMPLETED / CANCELLED`
- Admin dashboard with live counts
- Centralized exception handling with a consistent JSON response envelope
- Swagger / OpenAPI documentation with JWT "Authorize" support
- Seeded default admin account on first run
- CORS enabled for frontend integration
- Unit tests with JUnit 5 + Mockito

## 3. Tech Stack

| Layer          | Technology                              |
|----------------|------------------------------------------|
| Language       | Java 17                                   |
| Framework      | Spring Boot 3.3.x                         |
| Security       | Spring Security 6 + JWT (jjwt 0.12.x)     |
| Persistence    | Spring Data JPA / Hibernate               |
| Database       | MySQL 8                                   |
| Build Tool     | Maven                                     |
| Docs           | springdoc-openapi (Swagger UI)            |
| Boilerplate    | Lombok                                    |
| Validation     | Jakarta Bean Validation                   |
| Testing        | JUnit 5, Mockito, AssertJ, H2 (in-memory) |

## 4. Architecture

Clean, layered architecture with strict separation of concerns:

```
Controller → Service → Repository → Database
```

```
src/main/java/com/example/healthcare/
├── controller     # REST endpoints (no business logic)
├── service        # Business logic, transactions
├── repository     # Spring Data JPA interfaces
├── entity         # JPA entities
├── dto            # Request/response DTOs
├── exception      # Custom exceptions + @RestControllerAdvice
├── security       # JWT filter, JWT util, UserDetails adapter
├── config         # Security, CORS, Swagger, data seeding
└── util           # Small shared helpers (e.g. SecurityUtil)
```

A static frontend (plain HTML/CSS/JS, see §10) lives alongside it in `frontend/`.

## 5. Database Structure

```
User (login account: email, password, role)
 ├── 1-to-1 → Patient (profile: name, email, phone, DOB, gender, address)
 └── 1-to-1 → Doctor  (profile: name, email, phone, specialization, qualification, availableDays)

Patient  1 ────< Appointment >──── 1  Doctor
```

- `User.patient` / `User.doctor` — optional `@OneToOne`, since an ADMIN-created Patient/Doctor record may exist without a login.
- `Appointment.patient` / `Appointment.doctor` — `@ManyToOne`.
- `Patient.appointments` / `Doctor.appointments` — `@OneToMany` (mapped by the appointment side).

## 6. API Endpoints

### Auth (public)
| Method | Endpoint             | Description              |
|--------|-----------------------|---------------------------|
| POST   | `/api/auth/register`  | Register PATIENT/DOCTOR    |
| POST   | `/api/auth/login`     | Login, returns JWT         |
| GET    | `/api/auth/me`        | Current user + linked patient/doctor id (authenticated) |

### Patients
| Method | Endpoint                          | Roles              |
|--------|-------------------------------------|---------------------|
| POST   | `/api/patients`                    | ADMIN               |
| GET    | `/api/patients`                    | ADMIN, DOCTOR        |
| GET    | `/api/patients/{id}`               | authenticated        |
| PUT    | `/api/patients/{id}`               | ADMIN, PATIENT       |
| DELETE | `/api/patients/{id}`               | ADMIN                |
| GET    | `/api/patients/{id}/appointments`  | authenticated        |

### Doctors
| Method | Endpoint                                      | Roles              |
|--------|--------------------------------------------------|---------------------|
| POST   | `/api/doctors`                                  | ADMIN               |
| GET    | `/api/doctors`                                  | authenticated        |
| GET    | `/api/doctors/{id}`                             | authenticated        |
| GET    | `/api/doctors/specialization/{specialization}`  | authenticated        |
| PUT    | `/api/doctors/{id}`                             | ADMIN, DOCTOR        |
| DELETE | `/api/doctors/{id}`                             | ADMIN                |
| GET    | `/api/doctors/{id}/appointments`                | authenticated        |

### Appointments
| Method | Endpoint                              | Roles              |
|--------|------------------------------------------|---------------------|
| POST   | `/api/appointments`                    | ADMIN, PATIENT       |
| GET    | `/api/appointments`                    | ADMIN, DOCTOR        |
| GET    | `/api/appointments/{id}`               | authenticated        |
| GET    | `/api/appointments/patient/{patientId}`| authenticated        |
| GET    | `/api/appointments/doctor/{doctorId}`  | authenticated        |
| PUT    | `/api/appointments/{id}/cancel`        | authenticated        |
| PUT    | `/api/appointments/{id}/status`        | ADMIN, DOCTOR        |

### Admin
| Method | Endpoint                | Roles  |
|--------|--------------------------|--------|
| GET    | `/api/admin/dashboard`  | ADMIN  |

## 7. Setup Instructions

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL 8 running locally (or reachable via network)

### 1. Clone & configure

Set the following environment variables (or edit the defaults in `application.properties`):

```bash
export DB_URL="jdbc:mysql://localhost:3306/healthcare_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC"
export DB_USERNAME="root"
export DB_PASSWORD="your-mysql-password"
export JWT_SECRET="a-base64-encoded-256-bit-secret-change-me"
export ADMIN_EMAIL="admin@healthcare.com"
export ADMIN_PASSWORD="Admin@123"
```

> Generate a real JWT secret with: `openssl rand -base64 32`

### 2. Create the database (optional — `createDatabaseIfNotExist=true` handles this automatically)

```sql
CREATE DATABASE healthcare_db;
```

### 3. Run the application

```bash
mvn spring-boot:run
```

The app starts on **http://localhost:8080**. On first startup, a default ADMIN account is created automatically using `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### 4. Run tests

```bash
mvn test
```

## 8. Using Swagger UI

Open **http://localhost:8080/swagger-ui.html**

1. Call `POST /api/auth/login` (or `/register`) with sample credentials to get a JWT.
2. Click the **Authorize** button (top right, padlock icon).
3. Enter: `Bearer <your-token>`
4. All subsequent "Try it out" calls will include the token automatically.

## 9. Testing with Postman

1. Import the endpoints from the list above, or generate a collection from `http://localhost:8080/v3/api-docs`.
2. Call `/api/auth/login` first and copy the returned `token`.
3. In each subsequent request, add header: `Authorization: Bearer <token>`.

### Sample login (seeded admin)

```
POST /api/auth/login
{
  "email": "admin@healthcare.com",
  "password": "Admin@123"
}
```

### Sample: register a patient

```json
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "01700000000",
  "role": "PATIENT"
}
```

### Sample: register a doctor

```json
POST /api/auth/register
{
  "name": "Dr. Rahim Chowdhury",
  "email": "rahim@example.com",
  "password": "password123",
  "phone": "01800000000",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "qualification": "MBBS, MD (Cardiology)",
  "availableDays": "SUNDAY,TUESDAY,THURSDAY"
}
```

### Sample: book an appointment

```json
POST /api/appointments
{
  "patientId": 1,
  "doctorId": 1,
  "appointmentDate": "2026-10-05",
  "appointmentTime": "10:00:00",
  "reason": "Routine checkup"
}
```

### Sample success response

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": 1,
    "patientId": 1,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. Rahim Chowdhury",
    "doctorSpecialization": "Cardiology",
    "appointmentDate": "2026-10-05",
    "appointmentTime": "10:00:00",
    "reason": "Routine checkup",
    "status": "BOOKED",
    "createdAt": "2026-09-26T10:15:30"
  }
}
```

### Sample conflict response

```json
{
  "success": false,
  "message": "Doctor is already booked for this time."
}
```

## 10. Frontend UI

A plain HTML/CSS/JS single-page app lives in `frontend/` — no build step, no framework,
just static files that talk to the API above with `fetch`. It covers every role:

- **Login / Register** — register as a Patient or Doctor; the seeded Admin logs in directly.
- **Admin** — dashboard stats, manage doctors, manage patients, view/complete/cancel any appointment.
- **Doctor** — browse the doctor directory, view "My appointments", mark a booking as completed.
- **Patient** — search doctors by specialization, book an appointment (conflict/past-date errors
  surface inline), view and cancel "My appointments".

It relies on one small addition to the API beyond the original spec: **`GET /api/auth/me`**,
which returns the logged-in user's `patientId`/`doctorId` so the UI knows which records belong
to the current account (there was otherwise no way for a logged-in patient to discover their
own patient id). `SecurityConfig` was adjusted so only `/api/auth/register` and `/api/auth/login`
are public — `/api/auth/me` requires a valid JWT like everything else.

### Run it

The frontend is static, so any static file server works. From the project root:

```bash
cd frontend
python3 -m http.server 5500
# then open http://localhost:5500
```

or, with Node installed:

```bash
npx serve frontend -l 5500
```

Opening `index.html` directly by double-clicking (`file://`) usually also works since CORS is
wide open on the backend, but a local static server is the more reliable option, especially in
Chrome.

By default the UI calls the API at `http://localhost:8080/api`. To point it elsewhere, set this
before the other scripts load, e.g. by editing the top of `frontend/index.html`:

```html
<script>window.API_BASE_URL = "http://localhost:8080/api";</script>
<script src="js/api.js"></script>
```

### Frontend structure

```
frontend/
├── index.html      # Auth screen + app shell (sidebar/content mount points)
├── css/styles.css  # Design tokens + layout (a clinic "ledger" look — teal/gold/brick palette)
└── js/
    ├── api.js      # fetch wrapper, JWT storage in localStorage, error normalization
    └── app.js      # routing, per-role nav, view renderers (dashboard/doctors/patients/appointments)
```

## 11. Future Improvements

- Email/SMS appointment reminders
- Doctor availability slots validated against `availableDays`/working hours
- Pagination and filtering on list endpoints
- Refresh tokens and token revocation/blacklisting
- Soft deletes and audit logging
- Rate limiting on auth endpoints
- Dockerfile + docker-compose for one-command local setup
- Integration tests with Testcontainers (real MySQL instead of H2)

---

**Author:** Portfolio project prepared for a Junior Java Developer application at Square Health Ltd.

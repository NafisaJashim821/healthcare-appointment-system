# Square Health — Appointment Ledger (Frontend)

A static HTML/CSS/JS single-page app for the HealthCare Appointment Management System backend.
No build step, no framework — just `index.html`, `css/styles.css`, and `js/`.

## Run it

Any static file server works. Easiest options:

**VS Code**
1. Open this folder in VS Code.
2. Install the "Live Server" extension.
3. Open `index.html` → click "Go Live" (bottom-right).

**Python**
```bash
python3 -m http.server 5500
# open http://localhost:5500
```

**Node**
```bash
npx serve . -l 5500
```

## Requirements

This UI expects the backend (HealthCare Appointment Management System, Spring Boot) to be
running at `http://localhost:8080`. Start that separately (e.g. in IntelliJ) before logging in.

To point at a different backend URL, edit the top of `index.html`:

```html
<script>window.API_BASE_URL = "http://localhost:8080/api";</script>
<script src="js/api.js"></script>
```

## What's included

- **Login / Register** — register as a Patient or Doctor; use the seeded admin
  (`admin@healthcare.com` / `Admin@123`) to log in as Admin.
- **Admin** — dashboard stats, manage doctors, manage patients, view/complete/cancel any appointment.
- **Doctor** — doctor directory, "My appointments" with a Complete action.
- **Patient** — search doctors by specialization, book an appointment, view/cancel "My appointments".

## Note on the backend

This UI relies on one endpoint that's small but necessary: `GET /api/auth/me`, which returns
the logged-in user's linked `patientId`/`doctorId`. If you're pairing this frontend with a
different backend build, make sure that endpoint (and JWT auth on it) exists — otherwise
booking and "My appointments" won't know which patient/doctor record belongs to the account.

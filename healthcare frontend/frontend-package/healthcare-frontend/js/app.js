/**
 * Square Health — Appointment Ledger
 * Plain HTML/CSS/JS single-page app. No build step, no framework.
 * Talks to the Spring Boot API defined in api.js (API_BASE_URL).
 */

const el = (sel, root = document) => root.querySelector(sel);
const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  session: Session.get(), // { token, email, role, patientId, doctorId, name }
  view: null,
  doctors: [],
  patients: [],
  appointments: [],
};

const NAV_BY_ROLE = {
  ADMIN: [
    { id: "dashboard", label: "Dashboard" },
    { id: "doctors", label: "Doctors" },
    { id: "patients", label: "Patients" },
    { id: "appointments", label: "Appointments" },
  ],
  DOCTOR: [
    { id: "my-appointments", label: "My appointments" },
    { id: "doctors", label: "Doctor directory" },
  ],
  PATIENT: [
    { id: "doctors", label: "Find a doctor" },
    { id: "book", label: "Book appointment" },
    { id: "my-appointments", label: "My appointments" },
  ],
};

function toast(message, tone = "success") {
  const node = document.createElement("div");
  node.className = "toast";
  node.dataset.tone = tone;
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

function fieldErrorsToMessage(payload) {
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return Object.values(payload.data).join(" · ");
  }
  return null;
}

async function safeCall(promise, { onError } = {}) {
  try {
    return await promise;
  } catch (err) {
    const detail = fieldErrorsToMessage(err.payload);
    const message = detail || err.message || "Something went wrong.";
    if (onError) onError(message);
    else toast(message, "error");
    return null;
  }
}

/* ============================== AUTH ============================== */

function initAuthScreen() {
  els("[data-auth-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      els("[data-auth-tab]").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const target = tab.dataset.authTab;
      el("#loginForm").hidden = target !== "login";
      el("#registerForm").hidden = target !== "register";
    });
  });

  el('select[name="role"]', el("#registerForm")).addEventListener("change", (e) => {
    el(".form__row--doctor-only").hidden = e.target.value !== "DOCTOR";
  });

  el("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = el("#loginError");
    errorBox.hidden = true;
    const form = new FormData(e.target);

    const result = await safeCall(
      apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        body: { email: form.get("email"), password: form.get("password") },
      }),
      { onError: (msg) => { errorBox.textContent = msg; errorBox.hidden = false; } }
    );
    if (result) await onAuthenticated(result.data);
  });

  el("#registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = el("#registerError");
    const successBox = el("#registerSuccess");
    errorBox.hidden = true;
    successBox.hidden = true;
    const form = new FormData(e.target);

    const body = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      role: form.get("role"),
    };
    if (body.role === "DOCTOR") {
      body.specialization = form.get("specialization") || "General Medicine";
      body.qualification = form.get("qualification");
    }

    const result = await safeCall(
      apiRequest("/auth/register", { method: "POST", auth: false, body }),
      { onError: (msg) => { errorBox.textContent = msg; errorBox.hidden = false; } }
    );
    if (result) await onAuthenticated(result.data);
  });

  el("#logoutBtn").addEventListener("click", () => {
    Session.clear();
    state.session = null;
    location.reload();
  });
}

async function onAuthenticated(loginResponse) {
  const session = {
    token: loginResponse.token,
    email: loginResponse.email,
    role: loginResponse.role,
  };
  Session.set(session);
  state.session = session;

  const me = await safeCall(apiRequest("/auth/me"));
  if (me?.data) {
    state.session = { ...state.session, ...me.data };
    Session.set(state.session);
  }

  renderShell();
}

/* ============================== SHELL ============================== */

function renderShell() {
  el("#authScreen").hidden = true;
  el("#appShell").hidden = false;
  el("#sessionInfo").hidden = false;
  el("#sessionEmail").textContent = state.session.name
    ? `${state.session.name} · ${state.session.email}`
    : state.session.email;
  el("#roleBadge").textContent = state.session.role;

  const nav = NAV_BY_ROLE[state.session.role] || [];
  const sidebar = el("#sidebar");
  sidebar.innerHTML = "";
  nav.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.className = "sidebar__item" + (i === 0 ? " is-active" : "");
    btn.textContent = item.label;
    btn.dataset.view = item.id;
    btn.addEventListener("click", () => setView(item.id));
    sidebar.appendChild(btn);
  });

  setView(nav[0]?.id || "doctors");
}

function setActiveNav(viewId) {
  els(".sidebar__item").forEach((b) => b.classList.toggle("is-active", b.dataset.view === viewId));
}

async function setView(viewId) {
  state.view = viewId;
  setActiveNav(viewId);
  const mount = el("#view");
  mount.innerHTML = `<div class="empty">Loading…</div>`;

  const renderers = {
    dashboard: renderDashboard,
    doctors: renderDoctors,
    patients: renderPatients,
    appointments: renderAppointments,
    "my-appointments": renderMyAppointments,
    book: renderBookAppointment,
  };

  const renderer = renderers[viewId];
  if (renderer) await renderer(mount);
}

/* ============================== DASHBOARD (ADMIN) ============================== */

async function renderDashboard(mount) {
  const result = await safeCall(apiRequest("/admin/dashboard"));
  const d = result?.data;

  mount.innerHTML = `
    <div class="view__header">
      <div><h2>Dashboard</h2><p>System-wide snapshot, refreshed on load.</p></div>
      <button class="btn" id="refreshDash" type="button">Refresh</button>
    </div>
    ${d ? `
    <div class="stats">
      <div class="stat"><div class="stat__value">${d.totalPatients}</div><div class="stat__label">Total patients</div></div>
      <div class="stat"><div class="stat__value">${d.totalDoctors}</div><div class="stat__label">Total doctors</div></div>
      <div class="stat"><div class="stat__value">${d.totalAppointments}</div><div class="stat__label">Total appointments</div></div>
      <div class="stat" data-tone="gold"><div class="stat__value">${d.todayAppointments}</div><div class="stat__label">Today's appointments</div></div>
      <div class="stat"><div class="stat__value">${d.completedAppointments}</div><div class="stat__label">Completed</div></div>
      <div class="stat" data-tone="brick"><div class="stat__value">${d.cancelledAppointments}</div><div class="stat__label">Cancelled</div></div>
    </div>` : `<div class="empty">Could not load dashboard data.</div>`}
  `;

  el("#refreshDash")?.addEventListener("click", () => renderDashboard(mount));
}

/* ============================== DOCTORS ============================== */

async function renderDoctors(mount) {
  const isAdmin = state.session.role === "ADMIN";

  mount.innerHTML = `
    <div class="view__header">
      <div><h2>Doctors</h2><p>Directory of clinicians available at Square Health.</p></div>
      <div style="display:flex; gap:8px;">
        <input id="specSearch" type="text" placeholder="Search by specialization…"
          style="border:1px solid var(--line); border-radius:4px; padding:8px 10px; font-size:13.5px;" />
        <button class="btn" id="specSearchBtn" type="button">Search</button>
      </div>
    </div>
    ${isAdmin ? `<div class="panel" id="doctorFormPanel"><h3>Add a doctor</h3>${doctorFormHtml()}</div>` : ""}
    <div class="panel" style="margin-top:20px;">
      <table class="ledger" id="doctorsTable"><thead>
        <tr><th class="idx">#</th><th>Name</th><th>Specialization</th><th>Qualification</th><th>Contact</th><th>Available</th>${isAdmin ? "<th></th>" : ""}</tr>
      </thead><tbody></tbody></table>
    </div>
  `;

  if (isAdmin) {
    el("#doctorFormPanel form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = formToObject(e.target);
      const result = await safeCall(apiRequest("/doctors", { method: "POST", body }));
      if (result) { toast("Doctor created"); e.target.reset(); loadDoctors(); }
    });
  }

  el("#specSearchBtn").addEventListener("click", () => loadDoctors(el("#specSearch").value.trim()));
  el("#specSearch").addEventListener("keydown", (e) => { if (e.key === "Enter") loadDoctors(e.target.value.trim()); });

  await loadDoctors();

  async function loadDoctors(spec) {
    const path = spec ? `/doctors/specialization/${encodeURIComponent(spec)}` : "/doctors";
    const result = await safeCall(apiRequest(path));
    state.doctors = result?.data || [];
    renderDoctorRows(isAdmin);
  }
}

function doctorFormHtml() {
  return `
    <form class="form">
      <div class="form__row">
        <label>Name <input name="name" required /></label>
        <label>Email <input name="email" type="email" required /></label>
      </div>
      <div class="form__row">
        <label>Phone <input name="phone" required /></label>
        <label>Specialization <input name="specialization" required placeholder="Cardiology" /></label>
      </div>
      <div class="form__row">
        <label>Qualification <input name="qualification" placeholder="MBBS, MD" /></label>
        <label>Available days <input name="availableDays" placeholder="MONDAY,WEDNESDAY" /></label>
      </div>
      <button class="btn btn--primary" type="submit" style="align-self:flex-start;">Add doctor</button>
    </form>
  `;
}

function renderDoctorRows(isAdmin) {
  const tbody = el("#doctorsTable tbody");
  if (!state.doctors.length) {
    tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="empty">No doctors match yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.doctors.map((d, i) => `
    <tr data-id="${d.id}">
      <td class="idx">${String(i + 1).padStart(2, "0")}</td>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.specialization)}</td>
      <td>${escapeHtml(d.qualification || "—")}</td>
      <td>${escapeHtml(d.email)}<br><span style="color:var(--ink-soft)">${escapeHtml(d.phone)}</span></td>
      <td>${escapeHtml(d.availableDays || "—")}</td>
      ${isAdmin ? `<td class="actions"><button class="btn btn--sm btn--danger" data-delete-doctor="${d.id}">Delete</button></td>` : ""}
    </tr>
  `).join("");

  els("[data-delete-doctor]", tbody).forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this doctor?")) return;
      const result = await safeCall(apiRequest(`/doctors/${btn.dataset.deleteDoctor}`, { method: "DELETE" }));
      if (result) { toast("Doctor deleted"); setView("doctors"); }
    });
  });
}

/* ============================== PATIENTS (ADMIN) ============================== */

async function renderPatients(mount) {
  mount.innerHTML = `
    <div class="view__header">
      <div><h2>Patients</h2><p>Every registered patient record.</p></div>
    </div>
    <div class="panel"><h3>Add a patient</h3>
      <form class="form" id="patientForm">
        <div class="form__row">
          <label>Name <input name="name" required /></label>
          <label>Email <input name="email" type="email" required /></label>
        </div>
        <div class="form__row">
          <label>Phone <input name="phone" required /></label>
          <label>Date of birth <input name="dateOfBirth" type="date" /></label>
        </div>
        <div class="form__row">
          <label>Gender
            <select name="gender">
              <option value="">Not specified</option>
              <option>Female</option><option>Male</option><option>Other</option>
            </select>
          </label>
          <label>Address <input name="address" /></label>
        </div>
        <button class="btn btn--primary" type="submit" style="align-self:flex-start;">Add patient</button>
      </form>
    </div>
    <div class="panel" style="margin-top:20px;">
      <table class="ledger" id="patientsTable"><thead>
        <tr><th class="idx">#</th><th>Name</th><th>Contact</th><th>DOB</th><th>Gender</th><th>Address</th><th></th></tr>
      </thead><tbody></tbody></table>
    </div>
  `;

  el("#patientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = formToObject(e.target);
    if (!body.dateOfBirth) delete body.dateOfBirth;
    const result = await safeCall(apiRequest("/patients", { method: "POST", body }));
    if (result) { toast("Patient created"); e.target.reset(); loadPatients(); }
  });

  await loadPatients();

  async function loadPatients() {
    const result = await safeCall(apiRequest("/patients"));
    state.patients = result?.data || [];
    const tbody = el("#patientsTable tbody");
    if (!state.patients.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty">No patients yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.patients.map((p, i) => `
      <tr>
        <td class="idx">${String(i + 1).padStart(2, "0")}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.email)}<br><span style="color:var(--ink-soft)">${escapeHtml(p.phone)}</span></td>
        <td>${escapeHtml(p.dateOfBirth || "—")}</td>
        <td>${escapeHtml(p.gender || "—")}</td>
        <td>${escapeHtml(p.address || "—")}</td>
        <td class="actions"><button class="btn btn--sm btn--danger" data-delete-patient="${p.id}">Delete</button></td>
      </tr>
    `).join("");

    els("[data-delete-patient]", tbody).forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this patient?")) return;
        const result = await safeCall(apiRequest(`/patients/${btn.dataset.deletePatient}`, { method: "DELETE" }));
        if (result) { toast("Patient deleted"); loadPatients(); }
      });
    });
  }
}

/* ============================== APPOINTMENTS (ADMIN/DOCTOR: all) ============================== */

async function renderAppointments(mount) {
  mount.innerHTML = `
    <div class="view__header">
      <div><h2>Appointments</h2><p>Every booking in the ledger, grouped by date.</p></div>
    </div>
    <div class="panel"><div id="apptTableWrap"></div></div>
  `;
  const result = await safeCall(apiRequest("/appointments"));
  state.appointments = result?.data || [];
  el("#apptTableWrap").innerHTML = appointmentsTableHtml(state.appointments, { showStatusControls: true });
  bindAppointmentRowActions(el("#apptTableWrap"));
}

async function renderMyAppointments(mount) {
  const role = state.session.role;
  const id = role === "DOCTOR" ? state.session.doctorId : state.session.patientId;

  mount.innerHTML = `
    <div class="view__header">
      <div><h2>My appointments</h2><p>${role === "DOCTOR" ? "Your schedule with patients." : "Appointments you've booked."}</p></div>
    </div>
    <div class="panel"><div id="apptTableWrap">${id ? "" : `<div class="empty">No linked ${role.toLowerCase()} profile was found for this account yet.</div>`}</div></div>
  `;
  if (!id) return;

  const path = role === "DOCTOR" ? `/appointments/doctor/${id}` : `/appointments/patient/${id}`;
  const result = await safeCall(apiRequest(path));
  state.appointments = result?.data || [];
  el("#apptTableWrap").innerHTML = appointmentsTableHtml(state.appointments, {
    showStatusControls: role === "DOCTOR",
    showCancel: true,
  });
  bindAppointmentRowActions(el("#apptTableWrap"));
}

function appointmentsTableHtml(appointments, { showStatusControls = false, showCancel = false } = {}) {
  if (!appointments.length) {
    return `<div class="empty">No appointments here yet.</div>`;
  }

  const grouped = groupBy(appointments, (a) => a.appointmentDate);
  const dates = Object.keys(grouped).sort();

  const rows = dates.flatMap((date) => {
    const heading = `<tr class="ledger-date-heading"><td colspan="7">${formatDateHeading(date)}</td></tr>`;
    const body = grouped[date]
      .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
      .map((a) => appointmentRowHtml(a, { showStatusControls, showCancel }));
    return [heading, ...body];
  });

  return `
    <table class="ledger">
      <thead><tr>
        <th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

function appointmentRowHtml(a, { showStatusControls, showCancel }) {
  const statusClass = `status--${a.status.toLowerCase()}`;
  const canAct = a.status === "BOOKED";
  return `
    <tr data-id="${a.id}">
      <td class="idx">${a.appointmentTime}</td>
      <td>${escapeHtml(a.patientName)}</td>
      <td>${escapeHtml(a.doctorName)} <span style="color:var(--ink-soft)">(${escapeHtml(a.doctorSpecialization)})</span></td>
      <td>${escapeHtml(a.reason || "—")}</td>
      <td><span class="status ${statusClass}">${a.status}</span></td>
      <td class="actions">
        ${showStatusControls && canAct ? `<button class="btn btn--sm" data-complete="${a.id}">Complete</button>` : ""}
        ${(showCancel || showStatusControls) && canAct ? `<button class="btn btn--sm btn--danger" data-cancel="${a.id}">Cancel</button>` : ""}
      </td>
    </tr>
  `;
}

function bindAppointmentRowActions(root) {
  els("[data-cancel]", root).forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Cancel this appointment?")) return;
      const result = await safeCall(apiRequest(`/appointments/${btn.dataset.cancel}/cancel`, { method: "PUT" }));
      if (result) { toast("Appointment cancelled"); setView(state.view); }
    });
  });
  els("[data-complete]", root).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const result = await safeCall(apiRequest(`/appointments/${btn.dataset.complete}/status`, {
        method: "PUT",
        body: { status: "COMPLETED" },
      }));
      if (result) { toast("Marked as completed"); setView(state.view); }
    });
  });
}

/* ============================== BOOK APPOINTMENT (PATIENT) ============================== */

async function renderBookAppointment(mount) {
  const doctorsResult = await safeCall(apiRequest("/doctors"));
  const doctors = doctorsResult?.data || [];

  mount.innerHTML = `
    <div class="view__header">
      <div><h2>Book an appointment</h2><p>Pick a doctor, date and time. Double-bookings are rejected automatically.</p></div>
    </div>
    <div class="two-col">
      <div class="panel">
        <form class="form" id="bookForm">
          <p class="form__error" id="bookError" hidden></p>
          <label>Doctor
            <select name="doctorId" required>
              <option value="" disabled selected>Choose a doctor…</option>
              ${doctors.map((d) => `<option value="${d.id}">${escapeHtml(d.name)} — ${escapeHtml(d.specialization)}</option>`).join("")}
            </select>
          </label>
          <div class="form__row">
            <label>Date <input name="appointmentDate" type="date" required min="${todayIso()}" /></label>
            <label>Time <input name="appointmentTime" type="time" required /></label>
          </div>
          <label>Reason for visit
            <textarea name="reason" rows="3" placeholder="Briefly describe the reason for your visit"></textarea>
          </label>
          <button class="btn btn--primary" type="submit" style="align-self:flex-start;">Book appointment</button>
        </form>
      </div>
      <div class="panel">
        <h3>Before you book</h3>
        <p style="color:var(--ink-soft); font-size:13.5px;">
          Appointments can't be booked in the past, and a doctor can only hold one
          appointment per date and time. If a slot is already taken, you'll be asked
          to pick a different time.
        </p>
      </div>
    </div>
  `;

  el("#bookForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = el("#bookError");
    errorBox.hidden = true;

    if (!state.session.patientId) {
      errorBox.textContent = "No patient profile is linked to this account yet.";
      errorBox.hidden = false;
      return;
    }

    const form = new FormData(e.target);
    const body = {
      patientId: state.session.patientId,
      doctorId: Number(form.get("doctorId")),
      appointmentDate: form.get("appointmentDate"),
      appointmentTime: form.get("appointmentTime"),
      reason: form.get("reason"),
    };

    const result = await safeCall(
      apiRequest("/appointments", { method: "POST", body }),
      { onError: (msg) => { errorBox.textContent = msg; errorBox.hidden = false; } }
    );
    if (result) {
      toast("Appointment booked");
      e.target.reset();
    }
  });
}

/* ============================== HELPERS ============================== */

function formToObject(form) {
  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) obj[key] = value;
  return obj;
}

function groupBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
}

function formatDateHeading(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/* ============================== BOOT ============================== */

(function boot() {
  initAuthScreen();
  if (state.session?.token) {
    renderShell();
  }
})();

/**
 * Thin fetch wrapper around the HealthCare Appointment Management System API.
 * Change API_BASE_URL if your backend runs somewhere other than localhost:8080.
 */
const API_BASE_URL = window.API_BASE_URL || "http://localhost:8080/api";

const Session = {
  KEY: "healthcare.session",

  get() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || null;
    } catch {
      return null;
    }
  },

  set(session) {
    localStorage.setItem(this.KEY, JSON.stringify(session));
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};

/**
 * @param {string} path e.g. "/patients"
 * @param {{method?: string, body?: object, auth?: boolean}} options
 */
async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const session = Session.get();
    if (session?.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(
      `Could not reach the API at ${API_BASE_URL}. Is the backend running?`,
      0,
      null
    );
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload; // { success, message, data }
}

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload; // may contain field-level validation errors in `data`
  }
}

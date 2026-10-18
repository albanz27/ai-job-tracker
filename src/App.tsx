import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { APPLICATION_STATUSES } from "./types/job";
import type { ApplicationStatus, JobApplication } from "./types/job";
import "./App.css";

const initialApplications: JobApplication[] = [
  {
    id: "1",
    company: "Acme",
    role: "Junior Java Developer",
    status: "Inviata",
    appliedAt: "2026-10-18",
  },
  {
    id: "2",
    company: "TechLab",
    role: "Frontend Developer",
    status: "Colloquio",
    appliedAt: "2026-10-16",
  },
];

const STORAGE_KEY = "ai-job-tracker.applications";

function loadApplications(): JobApplication[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return initialApplications;
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return initialApplications;
    }

    const isValid = parsed.every(
      (item: unknown): item is JobApplication =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "company" in item &&
        typeof item.company === "string" &&
        "role" in item &&
        typeof item.role === "string" &&
        "status" in item &&
        typeof item.status === "string" &&
        APPLICATION_STATUSES.some((status) => status === item.status) &&
        "appliedAt" in item &&
        typeof item.appliedAt === "string",
    );

    return isValid ? parsed : initialApplications;
  } catch {
    return initialApplications;
  }
}

function App() {
  const [applications, setApplications] =
    useState<JobApplication[]>(loadApplications);

  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));

      setStorageError(null);
    } catch {
      setStorageError(
        "Salvataggio non riuscito: le ultime modifiche potrebbero andare perse al ricaricamento.",
      );
    }
  }, [applications]);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "Tutte">(
    "Tutte",
  );

  const filteredApplications = applications.filter(
    (application) =>
      statusFilter === "Tutte" || application.status === statusFilter,
  );

  function updateStatus(id: string, status: ApplicationStatus) {
    const nextApplications = applications.map((application) =>
      application.id === id ? { ...application, status } : application,
    );

    saveApplications(nextApplications);
  }

  function saveApplications(nextApplications: JobApplication[]) {
    setApplications(nextApplications);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextApplications));

      setStorageError(null);
    } catch {
      setStorageError(
        "Salvataggio non riuscito: le ultime modifiche potrebbero andare perse al ricaricamento.",
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanCompany = company.trim();
    const cleanRole = role.trim();

    if (!cleanCompany || !cleanRole) {
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const newApplication: JobApplication = {
      id: crypto.randomUUID(),
      company: cleanCompany,
      role: cleanRole,
      status: "Da inviare",
      appliedAt: `${year}-${month}-${day}`,
    };

    saveApplications([...applications, newApplication]);

    setCompany("");
    setRole("");
  }

  const stats = {
    total: applications.length,
    sent: applications.filter((application) => application.status === "Inviata")
      .length,
    interviews: applications.filter(
      (application) => application.status === "Colloquio",
    ).length,
    offers: applications.filter(
      (application) => application.status === "Offerta",
    ).length,
  };

  function deleteApplication(id: string) {
    const application = applications.find(
      (application) => application.id === id,
    );

    if (!application) {
      return;
    }

    const confirmed = window.confirm(
      `Vuoi eliminare la candidatura per ${application.role} presso ${application.company}?`,
    );

    if (!confirmed) {
      return;
    }

    saveApplications(
      applications.filter((application) => application.id !== id),
    );
  }

  return (
    <main>
      <h1>AI Job Tracker</h1>
      <p>Organizza le tue candidature di lavoro.</p>

      {storageError && <p className="error">{storageError}</p>}

      <section aria-label="Statistiche candidature">
        <dl className="stats">
          <div className="stat-card">
            <dt>Candidature totali</dt>
            <dd>{stats.total}</dd>
          </div>

          <div className="stat-card">
            <dt>Inviate</dt>
            <dd>{stats.sent}</dd>
          </div>

          <div className="stat-card">
            <dt>Colloqui</dt>
            <dd>{stats.interviews}</dd>
          </div>

          <div className="stat-card">
            <dt>Offerte</dt>
            <dd>{stats.offers}</dd>
          </div>
        </dl>
      </section>

      <h2>Nuova candidatura</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="company">Azienda</label>
          <input
            id="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="role">Ruolo</label>
          <input
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            maxLength={150}
            required
          />
        </div>

        <button type="submit" disabled={!company.trim() || !role.trim()}>
          Aggiungi candidatura
        </button>
      </form>

      <h2>Candidature ({applications.length})</h2>

      <label htmlFor="status-filter">Filtra per stato</label>

      <select
        id="status-filter"
        value={statusFilter}
        onChange={(event) => {
          const value = event.target.value;

          if (value === "Tutte") {
            setStatusFilter(value);
            return;
          }

          const status = APPLICATION_STATUSES.find(
            (status) => status === value,
          );

          if (status !== undefined) {
            setStatusFilter(status);
          }
        }}
      >
        <option value="Tutte">Tutte</option>

        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <p>
        Mostrate {filteredApplications.length} candidature su{" "}
        {applications.length}
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Azienda</th>
              <th>Ruolo</th>
              <th>Stato</th>
              <th>Data candidatura</th>
              <th>Azioni</th>
            </tr>
          </thead>

          <tbody>
            {filteredApplications.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  {applications.length === 0
                    ? "Non hai ancora candidature. Aggiungi la prima dal form."
                    : "Nessuna candidatura corrisponde al filtro selezionato."}
                </td>
              </tr>
            )}
            {filteredApplications.map((application) => (
              <tr key={application.id}>
                <td>{application.company}</td>
                <td>{application.role}</td>
                <td>
                  <select
                    aria-label={`Stato della candidatura per ${application.role} presso ${application.company}`}
                    value={application.status}
                    onChange={(event) => {
                      const status = APPLICATION_STATUSES.find(
                        (status) => status === event.target.value,
                      );

                      if (status !== undefined) {
                        updateStatus(application.id, status);
                      }
                    }}
                  >
                    {APPLICATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{application.appliedAt}</td>
                <td>
                  <button
                    type="button"
                    className="delete-button"
                    aria-label={`Elimina la candidatura per ${application.role} presso ${application.company}`}
                    onClick={() => deleteApplication(application.id)}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default App;

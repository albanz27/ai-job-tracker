export const APPLICATION_STATUSES = [
  "Da inviare",
  "Inviata",
  "Colloquio",
  "Offerta",
  "Rifiutata",
] as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[number];

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
}
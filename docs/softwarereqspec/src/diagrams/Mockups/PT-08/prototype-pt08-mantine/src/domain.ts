// PROTOTIPO USA E GETTA. Regole di PT-08 e dati d'esempio. Mario Rossi ha le stesse schede del prototipo PT-05.

export const TODAY = "2026-11-28";

export type Assignment = { id: number; plan: string; start: string; weeks: number; status: "draft" | "confirmed" };
// Stati degli appuntamenti e delle richieste come in PT-07: confermati, in attesa, rifiutati.
export type AppointmentStatus = "Confermato" | "In attesa" | "Rifiutato";
export type Appointment = { date: string; time: string; status: AppointmentStatus };
export type Athlete = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  height: number;
  weight: number;
  gyms: string[];
  assignments: Assignment[];
  appointments: Appointment[];
};

const ATHLETES: Athlete[] = [
  { id: "rossi", firstName: "Mario", lastName: "Rossi", email: "mario.rossi@mail.it", birthDate: "1999-05-14", height: 178, weight: 76, gyms: ["FitLab Pisa"],
    assignments: [
      { id: 1, plan: "Forza base", start: "2026-01-05", weeks: 8, status: "confirmed" },
      { id: 2, plan: "Ipertrofia 12 settimane", start: "2026-03-02", weeks: 12, status: "confirmed" },
      { id: 3, plan: "Mantenimento", start: "2026-11-09", weeks: 4, status: "confirmed" },
      { id: 4, plan: "Ipertrofia invernale", start: "2027-03-01", weeks: 12, status: "draft" },
    ],
    appointments: [{ date: "2026-12-02", time: "18:30", status: "Confermato" }, { date: "2026-12-09", time: "18:30", status: "In attesa" }] },
  { id: "bianchi", firstName: "Giulia", lastName: "Bianchi", email: "giulia.bianchi@mail.it", birthDate: "1995-09-02", height: 165, weight: 58, gyms: ["FitLab Pisa", "Palestra Arno"],
    assignments: [
      { id: 5, plan: "Tonificazione", start: "2026-09-07", weeks: 12, status: "confirmed" },
      { id: 6, plan: "Forza base", start: "2026-11-30", weeks: 8, status: "draft" },
    ],
    appointments: [{ date: "2026-11-20", time: "10:00", status: "Confermato" }, { date: "2026-12-01", time: "09:30", status: "In attesa" }] },
  { id: "conti", firstName: "Luca", lastName: "Conti", email: "luca.conti@mail.it", birthDate: "2003-02-11", height: 182, weight: 80, gyms: ["Palestra Arno"],
    assignments: [{ id: 7, plan: "Forza avanzata", start: "2026-10-05", weeks: 12, status: "confirmed" }],
    appointments: [{ date: "2026-12-05", time: "17:00", status: "Rifiutato" }] },
  // Nota 2: atleta appena associato, senza schede e senza appuntamenti.
  { id: "esposito", firstName: "Sara", lastName: "Esposito", email: "sara.esposito@mail.it", birthDate: "2000-07-30", height: 170, weight: 62, gyms: ["FitLab Pisa"],
    assignments: [], appointments: [] },
  { id: "ferrari", firstName: "Marco", lastName: "Ferrari", email: "marco.ferrari@mail.it", birthDate: "1988-12-01", height: 175, weight: 84, gyms: ["Centro Sportivo Cisanello"],
    assignments: [
      { id: 8, plan: "Mantenimento", start: "2026-06-01", weeks: 4, status: "confirmed" },
      { id: 9, plan: "Ricomposizione", start: "2026-07-06", weeks: 12, status: "confirmed" },
    ],
    appointments: [{ date: "2026-12-03", time: "19:00", status: "Confermato" }] },
  { id: "greco", firstName: "Elena", lastName: "Greco", email: "elena.greco@mail.it", birthDate: "1997-03-21", height: 160, weight: 55, gyms: ["Palestra Arno"],
    assignments: [{ id: 10, plan: "Ipertrofia 12 settimane", start: "2026-11-02", weeks: 12, status: "confirmed" }],
    appointments: [] },
  { id: "ricci", firstName: "Chiara", lastName: "Ricci", email: "chiara.ricci@mail.it", birthDate: "2001-10-10", height: 168, weight: 60, gyms: ["FitLab Pisa"],
    assignments: [{ id: 11, plan: "Forza base", start: "2026-12-07", weeks: 8, status: "draft" }],
    appointments: [{ date: "2026-11-30", time: "18:00", status: "In attesa" }] },
  { id: "romano", firstName: "Davide", lastName: "Romano", email: "davide.romano@mail.it", birthDate: "1992-04-04", height: 185, weight: 90, gyms: ["Centro Sportivo Cisanello", "FitLab Pisa"],
    assignments: [
      { id: 12, plan: "Forza avanzata", start: "2026-08-03", weeks: 12, status: "confirmed" },
      { id: 13, plan: "Ipertrofia invernale", start: "2026-11-23", weeks: 12, status: "confirmed" },
    ],
    appointments: [{ date: "2026-11-25", time: "18:30", status: "Confermato" }, { date: "2026-12-04", time: "18:30", status: "Confermato" }] },
];

// Nota 4: solo gli atleti associati al PT autenticato. Passo 2: ordine alfabetico per cognome.
export const athletesOfPt = (empty: boolean) =>
  empty ? [] : [...ATHLETES].sort((a, b) => a.lastName.localeCompare(b.lastName, "it") || a.firstName.localeCompare(b.firstName, "it"));
export const athlete = (id: string) => ATHLETES.find((a) => a.id === id)!;

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const endOf = (a: Assignment) => addDays(a.start, a.weeks * 7 - 1);
export const fmt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
export const fullName = (a: Athlete) => `${a.firstName} ${a.lastName}`;
export const initials = (a: Athlete) => a.firstName[0] + a.lastName[0];
export function ageOf(a: Athlete) {
  const [y, m, d] = a.birthDate.split("-").map(Number);
  const [ty, tm, td] = TODAY.split("-").map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}
export function periodStatus(a: Assignment) {
  return TODAY < a.start ? "Programmata" : TODAY > endOf(a) ? "Terminata" : "In corso";
}
export const sortedAssignments = (a: Athlete) => [...a.assignments].sort((x, y) => x.start.localeCompare(y.start));
export const sortedAppointments = (a: Athlete) => [...a.appointments].sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
export const fmtLong = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

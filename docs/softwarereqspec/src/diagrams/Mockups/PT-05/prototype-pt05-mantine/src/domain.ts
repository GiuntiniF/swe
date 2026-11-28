// PROTOTIPO USA E GETTA. Regole di PT-05 e dati d'esempio, uguali alla versione shadcn.

export const TODAY = "2026-11-26";

export type Plan = { id: string; name: string; blocks: number[]; unconfigured?: string };
export type Row = { id: string; name: string; sets: string; rest: string; drop?: number; superset?: string };
export type Session = { id: string; name: string; focus: string; rows: Row[] };
export type Loads = Record<string, number | "">;
export type Assignment = { id: number; planId: string; start: string; status: "draft" | "confirmed"; loads: Loads };
export type FlowError =
  | { type: "missing"; weeks: number[] }
  | { type: "overlap" | "overlap-confirm"; with: number }
  | null;
export type Flow = {
  id: number | null;
  planId: string | null;
  start: string;
  loads: Loads;
  pre: Set<string>;
  showErrors: boolean;
  error: FlowError;
  notice: string | null;
  week: number;
  session: string;
  resumed: boolean;
};

export const ATHLETE = { name: "Mario Rossi", initials: "MR", email: "mario.rossi@mail.it", age: 27, height: 178, weight: 76, gyms: ["FitLab Pisa"] };
// Stati come in PT-07: confermati, in attesa, rifiutati.
export type AppointmentStatus = "Confermato" | "In attesa" | "Rifiutato";
export const APPOINTMENTS: { date: string; time: string; status: AppointmentStatus }[] = [
  { date: "2026-12-02", time: "18:30", status: "Confermato" },
  { date: "2026-12-09", time: "18:30", status: "In attesa" },
];
export const PLANS: Plan[] = [
  { id: "forza-base", name: "Forza base", blocks: [4, 4] },
  { id: "ipertrofia-12", name: "Ipertrofia 12 settimane", blocks: [4, 4, 4] },
  { id: "mantenimento", name: "Mantenimento", blocks: [4] },
  { id: "forza-avanzata", name: "Forza avanzata", blocks: [4, 4, 4] },
  { id: "ipertrofia-invernale", name: "Ipertrofia invernale", blocks: [4, 4, 4] },
  { id: "ricomposizione", name: "Ricomposizione", blocks: [4], unconfigured: "Il blocco mensile 1 non ha sessioni di allenamento." },
];
export const SESSIONS: Session[] = [
  { id: "s1", name: "Sessione 1", focus: "Spinta e gambe", rows: [
    { id: "squat", name: "Squat", sets: "5 × 5", rest: "180 s" },
    { id: "panca", name: "Panca piana", sets: "4 × 6", rest: "150 s", drop: 0.7 },
    { id: "rematore", name: "Rematore con bilanciere", sets: "3 × 10", rest: "—", superset: "A" },
    { id: "lento", name: "Lento avanti", sets: "3 × 10", rest: "90 s", superset: "A" },
  ] },
  { id: "s2", name: "Sessione 2", focus: "Tirata", rows: [
    { id: "stacco", name: "Stacco da terra", sets: "5 × 3", rest: "180 s" },
    { id: "trazioni", name: "Trazioni zavorrate", sets: "4 × 6", rest: "120 s" },
  ] },
];
export const EX_IDS = SESSIONS.flatMap((s) => s.rows.map((r) => r.id));
const BASE: Record<string, number> = { squat: 100, panca: 80, rematore: 60, lento: 40, stacco: 130, trazioni: 10 };

export const plan = (id: string) => PLANS.find((p) => p.id === id)!;
export const weeksOf = (p: Plan) => p.blocks.reduce((a, b) => a + b, 0);
export const key = (w: number, ex: string) => `${w}|${ex}`;
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const daysBetween = (a: string, b: string) => (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000;
// Nota 3: la data di fine è l'ultimo giorno dell'ultimo blocco mensile.
export const endOf = (planId: string, start: string) => addDays(start, weeksOf(plan(planId)) * 7 - 1);
export const fmt = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "—");
export const fmtLong = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const kg = (v: number) => v.toLocaleString("it-IT", { maximumFractionDigits: 1 });
export function blockOfWeek(p: Plan, w: number) {
  let acc = 0;
  for (let i = 0; i < p.blocks.length; i++) {
    if (w <= acc + p.blocks[i]) return { block: i + 1, inBlock: w - acc };
    acc += p.blocks[i];
  }
  return { block: p.blocks.length, inBlock: 1 };
}
export function weeksOfBlock(p: Plan, b: number) {
  const s = p.blocks.slice(0, b - 1).reduce((a, x) => a + x, 0);
  return Array.from({ length: p.blocks[b - 1] }, (_, i) => s + i + 1);
}
export function hasLoad(f: Flow, w: number, ex: string) {
  const v = f.loads[key(w, ex)];
  return v !== undefined && v !== "" && !Number.isNaN(v);
}
export const missingInWeek = (f: Flow, w: number) => EX_IDS.filter((ex) => !hasLoad(f, w, ex)).length;
export function incompleteWeeks(f: Flow) {
  const W = weeksOf(plan(f.planId!));
  return Array.from({ length: W }, (_, i) => i + 1).filter((w) => missingInWeek(f, w) > 0);
}
export function totals(f: Flow) {
  const W = weeksOf(plan(f.planId!));
  let filled = 0;
  for (let w = 1; w <= W; w++) filled += EX_IDS.length - missingInWeek(f, w);
  return { filled, total: W * EX_IDS.length };
}
// Nota 2: un solo carico; la discesa del drop-set usa il moltiplicatore della variante.
export const dropValue = (f: Flow, w: number, row: Row) =>
  hasLoad(f, w, row.id) ? Math.round((f.loads[key(w, row.id)] as number) * row.drop! * 2) / 2 : null;
// Nota 5: il controllo di sovrapposizione considera solo le assegnazioni confermate.
export function overlapFor(list: Assignment[], start: string, end: string, excludeId: number | null) {
  return list.find((a) => a.status === "confirmed" && a.id !== excludeId && a.start <= end && start <= endOf(a.planId, a.start));
}
export function firstFreeDay(list: Assignment[]) {
  const last = list.filter((a) => a.status === "confirmed").map((a) => endOf(a.planId, a.start)).sort().pop()!;
  const d = addDays(last, 1);
  return d < TODAY ? TODAY : d;
}
// Nota 1: ogni sessione è precompilata con i carichi della stessa sessione nella week precedente.
export function prefillWeek(f: Flow, w: number, exIds = EX_IDS) {
  if (w <= 1) return 0;
  let n = 0;
  for (const ex of exIds)
    if (!hasLoad(f, w, ex) && hasLoad(f, w - 1, ex)) {
      f.loads[key(w, ex)] = f.loads[key(w - 1, ex)];
      f.pre.add(key(w, ex));
      n++;
    }
  return n;
}
export function weekRanges(ws: number[]) {
  const out: [number, number][] = [];
  for (const w of ws) {
    const last = out[out.length - 1];
    if (last && w === last[1] + 1) last[1] = w;
    else out.push([w, w]);
  }
  return out.map(([a, b]) => (a === b ? `Week ${a}` : `Week ${a}–${b}`)).join(", ");
}
export function periodStatus(a: { planId: string; start: string }) {
  const e = endOf(a.planId, a.start);
  return TODAY < a.start ? "Programmata" : TODAY > e ? "Terminata" : "In corso";
}
export const planSub = (p: Plan) => `${p.blocks.length} ${p.blocks.length === 1 ? "blocco mensile" : "blocchi mensili"} · ${weeksOf(p)} settimane`;

function genLoads(weeks: number, partial: Record<number, string[]> = {}) {
  const L: Loads = {};
  for (let w = 1; w <= weeks; w++) for (const ex of EX_IDS) L[key(w, ex)] = BASE[ex] + Math.floor((w - 1) / 2) * 2.5;
  for (const [w, exs] of Object.entries(partial)) for (const ex of EX_IDS) if (!exs.includes(ex)) delete L[key(+w, ex)];
  return L;
}
export function initialAssignments(): Assignment[] {
  return [
    { id: 1, planId: "forza-base", start: "2026-01-05", status: "confirmed", loads: genLoads(8) },
    { id: 2, planId: "ipertrofia-12", start: "2026-03-02", status: "confirmed", loads: genLoads(12) },
    { id: 3, planId: "mantenimento", start: "2026-11-09", status: "confirmed", loads: genLoads(4) },
    { id: 4, planId: "ipertrofia-invernale", start: "2027-03-01", status: "draft", loads: genLoads(4, { 4: ["squat", "panca"] }) },
  ];
}
export const newFlow = (): Flow => ({
  id: null, planId: null, start: "", loads: {}, pre: new Set(), showErrors: false, error: null, notice: null, week: 1, session: "s1", resumed: false,
});
export function flowFromDraft(a: Assignment): Flow {
  const f: Flow = { ...newFlow(), id: a.id, planId: a.planId, start: a.start, loads: { ...a.loads }, showErrors: true, resumed: true };
  f.week = incompleteWeeks(f)[0] || 1;
  return f;
}

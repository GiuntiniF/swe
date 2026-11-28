// PROTOTIPO USA E GETTA. Regole di PT-04 e dati d'esempio.
// La struttura segue il Domain Model: TrainingPlan → MonthlyBlock (weeksCount) → TrainingSession → Exercise.
// Un Exercise ha un Reps per ogni serie (FixedReps, RangeReps, FailureReps), un recupero e delle note.
// Le varianti di esecuzione sono Superset (Composite), DropSetDecorator e RestPauseDecorator (Decorator).

/** Nota 3: un blocco contiene al massimo 7 sessioni, una per ogni giorno della settimana. */
export const MAX_SESSIONS = 7;
export const MAX_WEEKS = 8;

export type ExerciseType = { id: string; name: string; group: string; muscles: string };
export type Reps = { type: "fixed"; n: number } | { type: "range"; min: number; max: number } | { type: "failure" };
export type Partner = { exerciseTypeId: string; reps: Reps };
export type Variant =
  | { kind: "none" }
  | { kind: "superset"; partners: Partner[] }
  | { kind: "dropset"; drops: number[] }
  | { kind: "restpause"; pause: number };
export type VariantKind = Variant["kind"];
export type Item = { id: string; exerciseTypeId: string; reps: Reps[]; rest: number; notes: string; variant: Variant };
export type Session = { id: string; items: Item[] };
export type Block = { id: string; weeks: number; sessions: Session[] };
export type Plan = { id: string; name: string; description: string; assignedTo: string[]; blocks: Block[] };

// Nota 4: il catalogo è predefinito e in sola lettura.
export const CATALOG: ExerciseType[] = [
  { id: "squat", name: "Squat", group: "Gambe", muscles: "Quadricipiti, glutei, adduttori" },
  { id: "stacco-rumeno", name: "Stacco rumeno", group: "Gambe", muscles: "Femorali, glutei" },
  { id: "leg-press", name: "Leg press", group: "Gambe", muscles: "Quadricipiti, glutei" },
  { id: "affondi", name: "Affondi con manubri", group: "Gambe", muscles: "Quadricipiti, glutei" },
  { id: "leg-curl", name: "Leg curl", group: "Gambe", muscles: "Femorali" },
  { id: "calf", name: "Calf raise in piedi", group: "Gambe", muscles: "Polpacci" },
  { id: "panca", name: "Panca piana", group: "Petto", muscles: "Pettorali, tricipiti, deltoidi anteriori" },
  { id: "panca-inclinata", name: "Panca inclinata con manubri", group: "Petto", muscles: "Pettorali alti, deltoidi anteriori" },
  { id: "croci", name: "Croci ai cavi", group: "Petto", muscles: "Pettorali" },
  { id: "dip", name: "Dip alle parallele", group: "Petto", muscles: "Pettorali bassi, tricipiti" },
  { id: "stacco", name: "Stacco da terra", group: "Schiena", muscles: "Erettori, glutei, femorali, dorsali" },
  { id: "trazioni", name: "Trazioni zavorrate", group: "Schiena", muscles: "Dorsali, bicipiti" },
  { id: "rematore", name: "Rematore con bilanciere", group: "Schiena", muscles: "Dorsali, romboidi, trapezi" },
  { id: "lat", name: "Lat machine", group: "Schiena", muscles: "Dorsali" },
  { id: "pulley", name: "Pulley basso", group: "Schiena", muscles: "Dorsali, romboidi" },
  { id: "lento", name: "Lento avanti", group: "Spalle", muscles: "Deltoidi, tricipiti" },
  { id: "alzate", name: "Alzate laterali", group: "Spalle", muscles: "Deltoidi laterali" },
  { id: "face-pull", name: "Face pull", group: "Spalle", muscles: "Deltoidi posteriori, cuffia dei rotatori" },
  { id: "curl", name: "Curl con bilanciere", group: "Braccia", muscles: "Bicipiti" },
  { id: "pushdown", name: "Push-down ai cavi", group: "Braccia", muscles: "Tricipiti" },
  { id: "french", name: "French press", group: "Braccia", muscles: "Tricipiti" },
  { id: "plank", name: "Plank", group: "Core", muscles: "Addominali, trasverso" },
  { id: "crunch", name: "Crunch ai cavi", group: "Core", muscles: "Retto dell'addome" },
];
export const GROUPS = [...new Set(CATALOG.map((e) => e.group))];
export const ex = (id: string) => CATALOG.find((e) => e.id === id)!;

let seq = 100;
export const uid = (p: string) => `${p}${seq++}`;

// ---------- Etichette ----------
export const num = (v: number) => v.toLocaleString("it-IT", { maximumFractionDigits: 2 });
export function repsLabel(r: Reps) {
  if (r.type === "fixed") return String(r.n);
  if (r.type === "range") return `${r.min}–${r.max}`;
  return "cedimento";
}
const sameReps = (a: Reps, b: Reps) => repsLabel(a) === repsLabel(b);
export function setsLabel(reps: Reps[]) {
  if (reps.length && reps.every((r) => sameReps(r, reps[0]))) return `${reps.length} × ${repsLabel(reps[0])}`;
  return `${reps.length} serie: ${reps.map(repsLabel).join(" · ")}`;
}
export function variantLabel(v: Variant) {
  if (v.kind === "superset") return `Superset con ${v.partners.map((p) => ex(p.exerciseTypeId).name).join(" + ")}`;
  if (v.kind === "dropset") return `Drop-set ${v.drops.map((d) => `× ${num(d)}`).join(" → ")}`;
  if (v.kind === "restpause") return `Rest-pause, ${v.pause} s tra le miniserie`;
  return null;
}
// Stessi termini del prototipo e dei mockup Salt di PT-05.
export const VARIANT_NAMES: Record<VariantKind, string> = { none: "Nessuna", superset: "Superset", dropset: "Drop-set", restpause: "Rest-pause" };
export const sessionLabel = (i: number) => `Sessione ${i + 1}`;
/** La sessione non ha nome nel modello: il sottotitolo è ricavato dai gruppi muscolari degli esercizi. */
/** Tutti gli esercizi del catalogo usati nella sessione, compresi quelli in superserie. */
export const sessionExerciseIds = (s: Session) =>
  s.items.flatMap((i) => [i.exerciseTypeId, ...(i.variant.kind === "superset" ? i.variant.partners.map((p) => p.exerciseTypeId) : [])]);
export function sessionFocus(s: Session) {
  const g = [...new Set(sessionExerciseIds(s).map((id) => ex(id).group))];
  return g.length ? g.join(" · ") : "Nessun esercizio";
}
export const exCount = (n: number) => `${n} ${n === 1 ? "esercizio" : "esercizi"}`;
export const sessionSub = (s: Session) => (s.items.length ? `${exCount(s.items.length)} · ${sessionFocus(s)}` : "Nessun esercizio");
export const weeksLabel = (n: number) => `${n} ${n === 1 ? "settimana" : "settimane"}`;
export const sessionsLabel = (n: number) => `${n} ${n === 1 ? "sessione" : "sessioni"}`;
export const totalWeeks = (p: Plan) => p.blocks.reduce((a, b) => a + b.weeks, 0);
/** Nota 3: le sessioni del blocco sono un pattern settimanale che si ripete per ogni settimana. */
export const generated = (b: Block) => b.sessions.length * b.weeks;
/** Come in PT-05: una scheda è configurata se ogni blocco ha almeno una sessione e ogni sessione almeno un esercizio. */
export function unconfigured(p: Plan) {
  if (!p.blocks.length) return "La scheda non ha blocchi mensili.";
  const b = p.blocks.findIndex((x) => !x.sessions.length);
  if (b >= 0) return `Il blocco mensile ${b + 1} non ha sessioni di allenamento.`;
  for (let i = 0; i < p.blocks.length; i++) {
    const s = p.blocks[i].sessions.findIndex((x) => !x.items.length);
    if (s >= 0) return `La sessione ${s + 1} del blocco mensile ${i + 1} non ha esercizi.`;
  }
  return null;
}
export const planSub = (p: Plan) =>
  p.blocks.length ? `${p.blocks.length} ${p.blocks.length === 1 ? "blocco mensile" : "blocchi mensili"} · ${totalWeeks(p)} settimane` : "Nessun blocco mensile";
/** Flusso 5c: la rimozione si porta dietro il superset o la variante. */
export function removalWarning(i: Item) {
  if (i.variant.kind === "superset") {
    const n = i.variant.partners.length;
    return `L'esercizio fa parte di un superset: ${n === 1 ? "sarà rimosso" : "saranno rimossi"} anche ${i.variant.partners.map((p) => ex(p.exerciseTypeId).name).join(" e ")}.`;
  }
  if (i.variant.kind === "dropset") return `L'esercizio ha una variante di esecuzione: sarà rimosso anche il drop-set (${i.variant.drops.length} ${i.variant.drops.length === 1 ? "discesa" : "discese"}).`;
  if (i.variant.kind === "restpause") return "L'esercizio ha una variante di esecuzione: sarà rimosso anche il rest-pause.";
  return null;
}

// ---------- Form dell'esercizio (passi 8-10, flusso 5a, variazione 9a) ----------
export type RepsDraft = { type: Reps["type"]; n: number | ""; min: number | ""; max: number | "" };
export type Draft = {
  blockId: string;
  sessionId: string;
  editingId: string | null;
  exerciseTypeId: string;
  sets: number | "";
  same: boolean;
  reps: RepsDraft[];
  rest: number | "";
  notes: string;
  kind: VariantKind;
  partners: { exerciseTypeId: string | null; reps: RepsDraft }[];
  drops: (number | "")[];
  pause: number | "";
  showErrors: boolean;
};
const rd = (r: Reps): RepsDraft => ({ type: r.type, n: r.type === "fixed" ? r.n : "", min: r.type === "range" ? r.min : "", max: r.type === "range" ? r.max : "" });
export const emptyReps = (): RepsDraft => ({ type: "fixed", n: 10, min: 8, max: 12 });
export function newDraft(blockId: string, sessionId: string, exerciseTypeId: string): Draft {
  return {
    blockId, sessionId, editingId: null, exerciseTypeId, sets: 3, same: true, reps: [emptyReps(), emptyReps(), emptyReps()], rest: 90, notes: "",
    kind: "none", partners: [{ exerciseTypeId: null, reps: emptyReps() }], drops: [0.7], pause: 15, showErrors: false,
  };
}
export function draftFromItem(blockId: string, sessionId: string, i: Item): Draft {
  const d = newDraft(blockId, sessionId, i.exerciseTypeId);
  const v = i.variant;
  return {
    ...d, editingId: i.id, sets: i.reps.length, same: i.reps.every((r) => sameReps(r, i.reps[0])), reps: i.reps.map(rd), rest: i.rest, notes: i.notes, kind: v.kind,
    partners: v.kind === "superset" ? v.partners.map((p) => ({ exerciseTypeId: p.exerciseTypeId, reps: rd(p.reps) })) : d.partners,
    drops: v.kind === "dropset" ? [...v.drops] : d.drops,
    pause: v.kind === "restpause" ? v.pause : d.pause,
  };
}
/** Tiene la lista delle ripetizioni lunga quanto il numero di serie. */
export function resizeReps(d: Draft) {
  const n = typeof d.sets === "number" && d.sets > 0 ? Math.min(d.sets, 12) : d.reps.length;
  while (d.reps.length < n) d.reps.push({ ...d.reps[d.reps.length - 1] ?? emptyReps() });
  d.reps.length = n;
}
function repsError(r: RepsDraft) {
  if (r.type === "fixed") return r.n === "" || r.n < 1 ? "Inserisci le ripetizioni" : null;
  if (r.type === "range") {
    if (r.min === "" || r.max === "") return "Inserisci minimo e massimo";
    if (r.min < 1 || r.max <= r.min) return "Il massimo deve essere maggiore del minimo";
  }
  return null;
}
export type DraftErrors = Partial<Record<string, string>>;
export function validate(d: Draft): DraftErrors {
  const e: DraftErrors = {};
  if (d.sets === "" || d.sets < 1) e.sets = "Almeno una serie";
  else if (d.sets > 12) e.sets = "Al massimo 12 serie";
  const reps = d.same ? d.reps.slice(0, 1) : d.reps;
  reps.forEach((r, i) => { const m = repsError(r); if (m) e[`reps${i}`] = m; });
  if (d.rest === "" || d.rest < 0) e.rest = "Inserisci il recupero in secondi";
  if (d.kind === "superset") {
    if (!d.partners.length) e.partners = "Aggiungi almeno un esercizio alla superserie";
    d.partners.forEach((p, i) => {
      if (!p.exerciseTypeId) e[`partner${i}`] = "Scegli un esercizio";
      else if (p.exerciseTypeId === d.exerciseTypeId) e[`partner${i}`] = "È già l'esercizio principale";
      const m = repsError(p.reps); if (m) e[`partnerReps${i}`] = m;
    });
  }
  if (d.kind === "dropset") d.drops.forEach((x, i) => { if (x === "" || x <= 0 || x >= 1) e[`drop${i}`] = "Tra 0 e 1, per esempio 0,7"; });
  if (d.kind === "restpause" && (d.pause === "" || d.pause < 1)) e.pause = "Inserisci il tempo in secondi";
  return e;
}
const toReps = (r: RepsDraft): Reps =>
  r.type === "fixed" ? { type: "fixed", n: r.n as number } : r.type === "range" ? { type: "range", min: r.min as number, max: r.max as number } : { type: "failure" };
export function itemFromDraft(d: Draft): Item {
  const sets = d.sets as number;
  const reps = d.same ? Array.from({ length: sets }, () => toReps(d.reps[0])) : d.reps.slice(0, sets).map(toReps);
  const variant: Variant =
    d.kind === "superset" ? { kind: "superset", partners: d.partners.map((p) => ({ exerciseTypeId: p.exerciseTypeId!, reps: toReps(p.reps) })) }
    : d.kind === "dropset" ? { kind: "dropset", drops: d.drops as number[] }
    : d.kind === "restpause" ? { kind: "restpause", pause: d.pause as number }
    : { kind: "none" };
  return { id: d.editingId ?? uid("e"), exerciseTypeId: d.exerciseTypeId, reps, rest: d.rest as number, notes: d.notes.trim(), variant };
}

// ---------- Dati d'esempio ----------
const F = (n: number): Reps => ({ type: "fixed", n });
const R = (min: number, max: number): Reps => ({ type: "range", min, max });
const X: Reps = { type: "failure" };
const sets = (n: number, r: Reps) => Array.from({ length: n }, () => r);
const it = (exerciseTypeId: string, reps: Reps[], rest: number, variant: Variant = { kind: "none" }, notes = ""): Item => ({ id: uid("e"), exerciseTypeId, reps, rest, notes, variant });
const ses = (...items: Item[]): Session => ({ id: uid("s"), items });
const blk = (weeks: number, ...sessions: Session[]): Block => ({ id: uid("b"), weeks, sessions });

// Le stesse due sessioni del prototipo PT-05 (Sessione 1 e Sessione 2), ripetute in ogni blocco delle schede configurate.
const pt05Sessions = () => [
  ses(
    it("squat", sets(5, F(5)), 180, undefined, "Discesa controllata in 3 secondi."),
    it("panca", sets(4, F(6)), 150, { kind: "dropset", drops: [0.7] }),
    it("rematore", sets(3, F(10)), 90, { kind: "superset", partners: [{ exerciseTypeId: "lento", reps: F(10) }] }),
  ),
  ses(it("stacco", sets(5, F(3)), 180, undefined, "Presa mista solo sulle ultime due serie."), it("trazioni", sets(4, F(6)), 120)),
];
const pt05Blocks = (...weeks: number[]) => weeks.map((w) => blk(w, ...pt05Sessions()));
const MARIO = ["Mario Rossi"];

/** Le prime sei schede sono quelle di PT-05, nello stesso ordine; le assegnazioni sono quelle di Mario Rossi in PT-05. */
export function initialPlans(): Plan[] {
  seq = 1;
  return [
    { id: "forza-base", name: "Forza base", description: "Fondamentali con poche ripetizioni.", assignedTo: MARIO, blocks: pt05Blocks(4, 4) },
    { id: "ipertrofia-12", name: "Ipertrofia 12 settimane", description: "Volume medio-alto.", assignedTo: MARIO, blocks: pt05Blocks(4, 4, 4) },
    { id: "mantenimento", name: "Mantenimento", description: "Un blocco per mantenere la forza.", assignedTo: MARIO, blocks: pt05Blocks(4) },
    {
      id: "forza-avanzata", name: "Forza avanzata", description: "Fondamentali a basse ripetizioni, con lavoro complementare.", assignedTo: [],
      blocks: [
        blk(4, ...pt05Sessions()),
        blk(4,
          ses(
            it("squat", [F(5), F(5), F(3), F(3), F(3)], 180),
            it("panca", sets(5, F(5)), 150, { kind: "dropset", drops: [0.8, 0.6] }),
            it("lento", sets(3, F(8)), 90),
          ),
          ses(it("stacco", sets(4, F(3)), 210), it("trazioni", sets(4, F(5)), 120), it("panca-inclinata", sets(3, R(8, 10)), 90, { kind: "restpause", pause: 15 })),
        ),
        blk(4, ...pt05Sessions()),
      ],
    },
    // In PT-05 è assegnata solo in bozza: per PT-04 conta comunque come assegnata (flusso 1a, "in qualunque stato").
    { id: "ipertrofia-invernale", name: "Ipertrofia invernale", description: "Volume alto per la stagione invernale.", assignedTo: MARIO, blocks: pt05Blocks(4, 4, 4) },
    { id: "ricomposizione", name: "Ricomposizione", description: "Meno grasso, stessa massa muscolare.", assignedTo: [], blocks: [blk(4)] },
    // Schede in più, solo per provare i flussi 2a e 2f.
    { id: "definizione", name: "Definizione estiva", description: "Volume alto in vista dell'estate.", assignedTo: [], blocks: [] },
    {
      id: "preparazione-gara", name: "Preparazione gara", description: "Un blocco con una sessione al giorno.", assignedTo: [],
      blocks: [
        blk(2,
          ses(it("squat", sets(3, F(3)), 240)), ses(it("panca", sets(3, F(3)), 240)), ses(it("plank", sets(3, X), 60)),
          ses(it("stacco", sets(3, F(2)), 300)), ses(it("panca", sets(4, F(2)), 240)), ses(it("squat", sets(4, F(2)), 240)), ses(it("crunch", sets(3, F(15)), 45)),
        ),
      ],
    },
  ];
}

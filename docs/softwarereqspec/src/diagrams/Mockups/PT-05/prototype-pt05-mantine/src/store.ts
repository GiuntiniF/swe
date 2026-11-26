// PROTOTIPO USA E GETTA. Stato in memoria, mutabile: ogni azione chiama update() e l'app si ridisegna.
import { createContext, useContext } from "react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import {
  type Assignment, type Flow, endOf, fmt, incompleteWeeks, initialAssignments, overlapFor, plan,
} from "./domain";

export type Ui = {
  aView: "detail" | "plans" | "dates" | "loads" | "done";
  bSheet: boolean;
  bPhase: "setup" | "loads";
  bTab: string;
  cOpen: boolean;
  doneId: number | null;
  highlight: number | null;
  /** Cambia quando il calendario di B deve tornare sul mese della data scelta. */
  bCal: number;
};
export const initUi = (): Ui => ({ aView: "detail", bSheet: false, bPhase: "setup", bTab: "schede", cOpen: false, doneId: null, highlight: null, bCal: 0 });

export const S = {
  variant: 0,
  assignments: initialAssignments(),
  nextId: 5,
  flow: null as Flow | null,
  ui: initUi(),
  showState: false,
};

/** Ogni variante decide dove si torna dopo il salvataggio e cosa mostra alla conferma. */
export type VariantHooks = { resume(a: Assignment): void; leave(): void; done(a: Assignment): void };

export const UpdateContext = createContext<(fn?: () => void) => void>(() => {});
export const useUpdate = () => useContext(UpdateContext);

export const flow = () => S.flow!;

export function upsertDraft() {
  const f = flow();
  let a = S.assignments.find((x) => x.id === f.id);
  if (!a) {
    a = { id: S.nextId++, status: "draft", planId: f.planId!, start: f.start, loads: {} };
    S.assignments.push(a);
    f.id = a.id;
  }
  Object.assign(a, { planId: f.planId, start: f.start, loads: { ...f.loads } });
  return a;
}
// Passo 6: il sistema crea l'assegnazione in bozza (vedi il diagramma di sequenza PT-05 Assegnazione).
export function continueToLoads() {
  const f = flow();
  const o = overlapFor(S.assignments, f.start, endOf(f.planId!, f.start), f.id);
  if (o) { f.error = { type: "overlap", with: o.id }; return false; }
  f.error = null;
  upsertDraft();
  f.week = incompleteWeeks(f)[0] || 1;
  return true;
}
export function saveDraft(h: VariantHooks) {
  upsertDraft();
  S.ui.highlight = flow().id;
  h.leave();
  notifications.show({ title: "Bozza salvata", message: "La trovi tra le schede di Mario Rossi. Puoi riprenderla quando vuoi.", color: "yellow" });
}
export function submit(h: VariantHooks) {
  const f = flow();
  f.showErrors = true;
  const miss = incompleteWeeks(f);
  if (miss.length) { upsertDraft(); f.error = { type: "missing", weeks: miss }; return; }
  const o = overlapFor(S.assignments, f.start, endOf(f.planId!, f.start), f.id);
  if (o) { upsertDraft(); f.error = { type: "overlap-confirm", with: o.id }; return; }
  const a = upsertDraft();
  a.status = "confirmed";
  f.error = null;
  S.ui.highlight = a.id;
  h.done(a);
}
export function askDiscard(id: number, h: VariantHooks, update: (fn?: () => void) => void) {
  const a = S.assignments.find((x) => x.id === id)!;
  const name = plan(a.planId).name;
  modals.openConfirmModal({
    title: "Scartare la bozza?",
    children: `Elimini "${name}" (${fmt(a.start)} – ${fmt(endOf(a.planId, a.start))}) con tutti i carichi inseriti. L'operazione non è reversibile.`,
    labels: { confirm: "Scarta la bozza", cancel: "Annulla" },
    confirmProps: { color: "red" },
    onConfirm: () => update(() => {
      S.assignments = S.assignments.filter((x) => x.id !== id);
      if (S.flow && S.flow.id === id) h.leave();
      notifications.show({ title: "Bozza scartata", message: `"${name}" e i suoi carichi sono stati eliminati.`, color: "gray" });
    }),
  });
}
export const notifyOutOfScope = (title: string, message: string) => notifications.show({ title, message, color: "gray" });

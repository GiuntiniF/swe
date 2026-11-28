// PROTOTIPO USA E GETTA. Stato in memoria, mutabile: ogni azione chiama update() e l'app si ridisegna.
import { createContext, useContext } from "react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  type Draft, type Item, MAX_SESSIONS, draftFromItem, ex, initialPlans, itemFromDraft, newDraft, removalWarning, sessionLabel,
  uid, validate, weeksLabel,
} from "./domain";

export type Ui = {
  aView: "plan" | "session" | "catalog" | "form";
  bDrawer: "catalog" | "form" | null;
  cModal: "catalog" | "form" | null;
  highlight: string | null;
  query: string;
  group: string | null;
};
export const initUi = (): Ui => ({ aView: "plan", bDrawer: null, cModal: null, highlight: null, query: "", group: null });

export const S = {
  variant: 0,
  plans: initialPlans(),
  planId: null as string | null,
  /** Sessione corrente (passo 4). */
  sel: null as { blockId: string; sessionId: string } | null,
  draft: null as Draft | null,
  ui: initUi(),
  showState: false,
};

/** Ogni variante decide dove mostra la sessione, il catalogo e il form. */
export type VariantHooks = { plan(): void; session(): void; catalog(): void; form(): void };
export type Update = (fn?: () => void) => void;

export const UpdateContext = createContext<Update>(() => {});
export const useUpdate = () => useContext(UpdateContext);

export const plan = () => S.plans.find((p) => p.id === S.planId)!;
export const editable = () => plan().assignedTo.length === 0;
export const block = (id: string) => plan().blocks.find((b) => b.id === id)!;
export const blockIndex = (id: string) => plan().blocks.findIndex((b) => b.id === id);
export const session = (bId: string, sId: string) => block(bId).sessions.find((s) => s.id === sId)!;
export const sessionIndex = (bId: string, sId: string) => block(bId).sessions.findIndex((s) => s.id === sId);
export const selected = () => (S.sel ? { b: block(S.sel.blockId), s: session(S.sel.blockId, S.sel.sessionId) } : null);
export const where = (bId: string, sId: string) => `Blocco ${blockIndex(bId) + 1} · ${sessionLabel(sessionIndex(bId, sId))}`;

export function openPlan(id: string) {
  S.planId = id;
  S.sel = null;
  S.draft = null;
  S.ui = initUi();
}
export function closePlan() {
  S.planId = null;
  S.sel = null;
  S.draft = null;
  S.ui = initUi();
}
export function select(h: VariantHooks, blockId: string, sessionId: string) {
  S.sel = { blockId, sessionId };
  S.draft = null;
  h.session();
}

// Flussi 2a, 2b, 2d: il form della durata è nel modale aperto da askWeeks (shared.tsx).
export function addBlock(weeks: number) {
  const b = { id: uid("b"), weeks, sessions: [] };
  plan().blocks.push(b);
  S.ui.highlight = b.id;
  notifications.show({ title: `Blocco ${plan().blocks.length} aggiunto`, message: `${weeksLabel(weeks)}, ancora senza sessioni di allenamento.`, color: "green" });
}
export function setWeeks(blockId: string, weeks: number) {
  block(blockId).weeks = weeks;
  S.ui.highlight = blockId;
  notifications.show({ title: "Durata aggiornata", message: `Blocco ${blockIndex(blockId) + 1}: ${weeksLabel(weeks)}. Le sessioni non cambiano.`, color: "green" });
}
export function askDeleteBlock(blockId: string, update: Update) {
  const i = blockIndex(blockId);
  const b = block(blockId);
  const n = b.sessions.length;
  const e = b.sessions.reduce((a, s) => a + s.items.length, 0);
  modals.openConfirmModal({
    title: `Eliminare il blocco ${i + 1}?`,
    children: `Il blocco sarà eliminato con ${n === 1 ? "la sua sessione" : `le sue ${n} sessioni`} di allenamento e ${e === 1 ? "l'esercizio" : `i ${e} esercizi`} che contiene. L'operazione non è reversibile.${i < plan().blocks.length - 1 ? " I blocchi successivi scalano di una posizione." : ""}`,
    labels: { confirm: "Conferma Eliminazione", cancel: "Annulla" },
    confirmProps: { color: "red" },
    onConfirm: () => update(() => {
      plan().blocks.splice(i, 1);
      if (S.sel?.blockId === blockId) { S.sel = null; S.draft = null; S.ui.aView = "plan"; S.ui.bDrawer = null; S.ui.cModal = null; }
      notifications.show({ title: `Blocco ${i + 1} eliminato`, message: "Con tutte le sessioni e gli esercizi che conteneva.", color: "gray" });
    }),
  });
}

// Flussi 2c e 2f.
export function addSession(h: VariantHooks, blockId: string) {
  const b = block(blockId);
  if (b.sessions.length >= MAX_SESSIONS) return;
  const s = { id: uid("s"), items: [] };
  b.sessions.push(s);
  S.ui.highlight = s.id;
  select(h, blockId, s.id);
}
// Flusso 4a.
export function askDeleteSession(h: VariantHooks, blockId: string, sessionId: string, update: Update) {
  const s = session(blockId, sessionId);
  const label = where(blockId, sessionId);
  modals.openConfirmModal({
    title: `Eliminare ${label.split(" · ")[1].toLowerCase()}?`,
    children: `${label} sarà eliminata ${s.items.length ? `con ${s.items.length === 1 ? "l'esercizio" : `tutti i ${s.items.length} esercizi`} che contiene` : "(non contiene esercizi)"}. L'operazione non è reversibile.`,
    labels: { confirm: "Conferma Eliminazione", cancel: "Annulla" },
    confirmProps: { color: "red" },
    onConfirm: () => update(() => {
      const b = block(blockId);
      b.sessions = b.sessions.filter((x) => x.id !== sessionId);
      S.sel = null;
      S.draft = null;
      h.plan();
      notifications.show({ title: "Sessione eliminata", message: `${label}. Le sessioni successive scalano di una posizione.`, color: "gray" });
    }),
  });
}

// Passi 5-8 e flusso 5a.
export function startAdd(h: VariantHooks) {
  S.draft = null;
  S.ui.query = "";
  h.catalog();
}
export function pick(h: VariantHooks, exerciseTypeId: string) {
  const sel = S.sel!;
  if (S.draft) S.draft.exerciseTypeId = exerciseTypeId; // "Cambia esercizio" dal form: tiene i dati già inseriti
  else S.draft = newDraft(sel.blockId, sel.sessionId, exerciseTypeId);
  h.form();
}
export function startEdit(h: VariantHooks, blockId: string, sessionId: string, item: Item) {
  S.sel = { blockId, sessionId };
  S.draft = draftFromItem(blockId, sessionId, item);
  h.form();
}
/** Passi 10-12: aggiunge (o aggiorna) l'esercizio e torna al dettaglio della sessione. */
export function commit(h: VariantHooks) {
  const d = S.draft!;
  d.showErrors = true;
  if (Object.keys(validate(d)).length) return;
  const s = session(d.blockId, d.sessionId);
  const item = itemFromDraft(d);
  const i = s.items.findIndex((x) => x.id === item.id);
  if (i >= 0) s.items[i] = item;
  else s.items.push(item);
  S.ui.highlight = item.id;
  S.draft = null;
  h.session();
  notifications.show({
    title: i >= 0 ? "Esercizio aggiornato" : "Esercizio aggiunto",
    message: `${ex(item.exerciseTypeId).name} in ${where(d.blockId, d.sessionId)}.`,
    color: "green",
  });
}
export function cancelForm(h: VariantHooks) {
  S.draft = null;
  h.session();
}
// Flusso 5c.
export function askRemove(blockId: string, sessionId: string, item: Item, update: Update) {
  const w = removalWarning(item);
  const name = ex(item.exerciseTypeId).name;
  modals.openConfirmModal({
    title: `Rimuovere ${name}?`,
    children: `${name} sarà rimosso da ${where(blockId, sessionId)}.${w ? ` ${w}` : ""}`,
    labels: { confirm: "Conferma", cancel: "Annulla" },
    confirmProps: { color: "red" },
    onConfirm: () => update(() => {
      const s = session(blockId, sessionId);
      s.items = s.items.filter((x) => x.id !== item.id);
      notifications.show({ title: "Esercizio rimosso", message: `${name} da ${where(blockId, sessionId)}.`, color: "gray" });
    }),
  });
}

export const notifyOutOfScope = (title: string, message: string) => notifications.show({ title, message, color: "gray" });

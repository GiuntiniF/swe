// PROTOTIPO USA E GETTA. Stato in memoria, mutabile: ogni azione chiama update() e l'app si ridisegna.
import { createContext, useContext } from "react";
import { notifications } from "@mantine/notifications";
import { type Assignment, type Athlete, fmt, fullName } from "./domain";

// Stessi nomi di PT-05: aView per la pagina, bTab per la tab del dettaglio atleta.
export type Ui = { aView: "list" | "detail"; selected: string | null; bTab: string };
export const initUi = (): Ui => ({ aView: "list", selected: null, bTab: "schede" });

export const S = {
  /** Flusso alternativo 2a: il PT non ha atleti. */
  empty: false,
  ui: initUi(),
  showState: false,
};

export const UpdateContext = createContext<(fn?: () => void) => void>(() => {});
export const useUpdate = () => useContext(UpdateContext);

export const openAthlete = (id: string) => { S.ui.selected = id; S.ui.aView = "detail"; S.ui.bTab = "schede"; };
export const backToList = () => { S.ui.aView = "list"; };

const out = (title: string, message: string) => notifications.show({ title, message, color: "gray" });
// Passo 5: il flusso continua dal passo 3 di PT-05.
export const assignNew = (a: Athlete) =>
  out("Assegna nuova Scheda", `Per ${fullName(a)} il flusso continua dal passo 3 del caso d'uso PT-05 (vedi il prototipo PT-05).`);
// 5a: le schede confermate si personalizzano con PT-09.
export const personalize = (a: Athlete, s: Assignment) =>
  out("Personalizza la scheda", `"${s.plan}" (${fmt(s.start)}) di ${fullName(a)}: il flusso continua dal passo 3 del caso d'uso PT-09.`);
// 5b: le bozze si riprendono con il flusso 2a di PT-05.
export const resumeDraft = (a: Athlete, s: Assignment) =>
  out("Riprendi la bozza", `"${s.plan}" di ${fullName(a)}: il flusso continua dal flusso alternativo 2a del caso d'uso PT-05.`);
// Lo scarto di una bozza è il flusso 2b di PT-05: nel prototipo PT-05 funziona davvero.
export const discardDraft = (a: Athlete, s: Assignment) =>
  out("Scarta la bozza", `"${s.plan}" di ${fullName(a)}: il flusso continua dal flusso alternativo 2b del caso d'uso PT-05.`);
// 5c: il flusso continua dal passo 3 di PT-17 (la richiesta di conferma).
export const terminate = (a: Athlete) =>
  out("Termina Rapporto", `Con ${fullName(a)} il flusso continua dal passo 3 del caso d'uso PT-17: il sistema chiede conferma.`);

// PROTOTIPO USA E GETTA. Tre varianti Mantine di PT-04, da scorrere con la barra in basso o con i tasti ← →.
// La variante è nell'hash (#variante-a, #variante-b, #variante-c) o in ?variant=B.
import { useEffect, useReducer } from "react";
import { ActionIcon, Avatar, Box, Code, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconBarbell, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { MAX_SESSIONS, ex, initialPlans, sessionFocus, setsLabel, variantLabel, weeksLabel } from "./domain";
import { PlanList } from "./shared";
import { S, UpdateContext, initUi, plan, where } from "./store";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";

const VARIANTS: { key: string; slug: string; name: string; View: () => React.ReactNode }[] = [
  { key: "A", slug: "variante-a", name: "Pagine in sequenza", View: VariantA },
  { key: "B", slug: "variante-b", name: "Albero e pannello laterale", View: VariantB },
  { key: "C", slug: "variante-c", name: "Board della settimana tipo", View: VariantC },
];

function routeIndex() {
  const i = VARIANTS.findIndex((v) => v.slug === location.hash.slice(1));
  if (i >= 0) return i;
  const q = (new URLSearchParams(location.search).get("variant") || "A").toUpperCase();
  return Math.max(0, VARIANTS.findIndex((v) => v.key === q));
}
const go = (i: number) => { location.hash = VARIANTS[(i + VARIANTS.length) % VARIANTS.length].slug; };

function stateDump() {
  const v = VARIANTS[S.variant];
  const lines = [`Variante ${v.key} (${v.name})${S.variant === 0 && S.planId ? ` · vista: ${S.ui.aView}` : ""}`, ""];
  if (!S.planId) return [...lines, "Elenco delle schede (passo 1): nessuna scheda aperta."].join("\n");
  const p = plan();
  lines.push(`Scheda "${p.name}" · ${p.assignedTo.length ? `SOLA LETTURA, assegnata a ${p.assignedTo.join(", ")} (flusso 1a)` : "modificabile"}`);
  if (!p.blocks.length) lines.push("  nessun blocco mensile (flusso 2a)");
  p.blocks.forEach((b, bi) => {
    lines.push(`  Blocco ${bi + 1} · ${weeksLabel(b.weeks)} · ${b.sessions.length}/${MAX_SESSIONS} sessioni → ${b.sessions.length * b.weeks} allenamenti`);
    b.sessions.forEach((s, si) => {
      lines.push(`    Sessione ${si + 1} (${sessionFocus(s)})${S.sel?.sessionId === s.id ? "  ◀ corrente" : ""}`);
      for (const i of s.items) {
        const vl = variantLabel(i.variant);
        lines.push(`      ${ex(i.exerciseTypeId).name.padEnd(28)} ${setsLabel(i.reps).padEnd(14)} rec. ${i.rest} s${vl ? ` · ${vl}` : ""}${i.notes ? " · note" : ""}`);
      }
    });
  });
  lines.push("", "Form dell'esercizio:");
  const d = S.draft;
  if (!d) lines.push("  chiuso");
  else {
    lines.push(`  ${d.editingId ? "modifica (flusso 5a)" : "nuovo esercizio"} in ${where(d.blockId, d.sessionId)}: ${ex(d.exerciseTypeId).name}`);
    lines.push(`  serie ${d.sets || "—"} · ripetizioni ${d.same ? "uguali" : "per serie"} · recupero ${d.rest === "" ? "—" : `${d.rest} s`} · variante ${d.kind}`);
  }
  return lines.join("\n");
}

function Header() {
  return (
    <Box component="header" mb="lg" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
      <Group h={56} maw={1320} mx="auto" gap="lg">
        <Group gap={6}><IconBarbell size={22} /><Text fw={700}>Area PT</Text></Group>
        <Group gap="md" visibleFrom="sm">
          {["Atleti", "Schede", "Palestre", "Appuntamenti"].map((n) => <Text key={n} size="sm" fw={n === "Schede" ? 600 : 400} c={n === "Schede" ? undefined : "dimmed"}>{n}</Text>)}
        </Group>
        <Avatar size="sm" radius="xl" ml="auto">PT</Avatar>
      </Group>
    </Box>
  );
}

function Switcher({ update }: { update: (fn?: () => void) => void }) {
  const v = VARIANTS[S.variant];
  const pill: React.CSSProperties = { position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 400, background: "var(--mantine-color-dark-9)", color: "white" };
  return (
    <>
      {S.showState && (
        <Paper shadow="xl" radius="md" p="sm" style={{ ...pill, bottom: "calc(68px + env(safe-area-inset-bottom, 0px))", width: "min(720px, calc(100% - 32px))", maxHeight: "50vh", overflow: "auto" }}>
          <Code block style={{ background: "transparent", color: "white", whiteSpace: "pre-wrap" }}>{stateDump()}</Code>
        </Paper>
      )}
      <Group gap={4} wrap="nowrap" p={4} style={{ ...pill, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        <ActionIcon radius="xl" variant="subtle" color="gray" c="white" aria-label="Variante precedente" onClick={() => go(S.variant - 1)}><IconChevronLeft size={16} /></ActionIcon>
        <Text size="xs" fw={500} px={4} style={{ whiteSpace: "nowrap" }}><span style={{ opacity: 0.6 }}>PT-04 Mantine · </span>{v.key} <Box component="span" visibleFrom="xs" style={{ opacity: 0.7 }}>({v.name})</Box></Text>
        <ActionIcon radius="xl" variant="subtle" color="gray" c="white" aria-label="Variante successiva" onClick={() => go(S.variant + 1)}><IconChevronRight size={16} /></ActionIcon>
        <Box w={1} h={16} bg="rgba(255,255,255,.25)" />
        <UnstyledButton px="sm" h={28} fz="xs" fw={500} c="white" style={{ borderRadius: 999 }} aria-pressed={S.showState} onClick={() => update(() => { S.showState = !S.showState; })}>{S.showState ? "Nascondi stato" : "Stato"}</UnstyledButton>
        <UnstyledButton px="sm" h={28} fz="xs" fw={500} c="white" opacity={0.7} style={{ borderRadius: 999 }}
          onClick={() => update(() => { const id = S.planId; S.plans = initialPlans(); S.planId = id; S.sel = null; S.draft = null; S.ui = initUi(); })}>Reset</UnstyledButton>
      </Group>
    </>
  );
}

export function App() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const update = (fn?: () => void) => { fn?.(); bump(); };

  useEffect(() => {
    const apply = () => {
      const i = routeIndex();
      // Cambiando variante resta aperta la stessa scheda e la stessa sessione; si chiudono form e pannelli.
      if (i !== S.variant) { S.variant = i; S.draft = null; S.ui = { ...initUi(), aView: S.sel ? "session" : "plan" }; }
      bump();
    };
    apply();
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (e.key === "ArrowLeft") go(S.variant - 1);
      if (e.key === "ArrowRight") go(S.variant + 1);
    };
    window.addEventListener("hashchange", apply);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("hashchange", apply); window.removeEventListener("keydown", onKey); };
  }, []);

  const { View } = VARIANTS[S.variant];
  return (
    <UpdateContext.Provider value={update}>
      <Header />
      <Box maw={1320} mx="auto" pb={96}>{S.planId ? <View /> : <PlanList />}</Box>
      <Switcher update={update} />
    </UpdateContext.Provider>
  );
}

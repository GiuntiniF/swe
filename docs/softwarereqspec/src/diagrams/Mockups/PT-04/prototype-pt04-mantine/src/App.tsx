// PROTOTIPO USA E GETTA. PT-04 a pagine, nello stile scelto per PT-05 e PT-08.
// La barra in basso serve solo al prototipo: ha l'attributo data-prototype-bar, così gli screenshot la possono nascondere.
import { useReducer } from "react";
import { Avatar, Box, Code, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconBarbell } from "@tabler/icons-react";
import { MAX_SESSIONS, ex, initialPlans, sessionFocus, setsLabel, variantLabel, weeksLabel } from "./domain";
import { PlanConfiguration } from "./PlanConfiguration";
import { S, UpdateContext, initUi, plan, where } from "./store";

function stateDump() {
  const lines = [`Vista: ${S.planId ? S.ui.aView : "elenco schede"}`, ""];
  if (!S.planId) return [...lines, "Nessuna scheda aperta (passo 1)."].join("\n");
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

function PrototypeBar({ update }: { update: (fn?: () => void) => void }) {
  const pill: React.CSSProperties = { position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 400, background: "var(--mantine-color-dark-9)", color: "white" };
  return (
    <>
      {S.showState && (
        <Paper data-prototype-bar shadow="xl" radius="md" p="sm" style={{ ...pill, bottom: "calc(68px + env(safe-area-inset-bottom, 0px))", width: "min(720px, calc(100% - 32px))", maxHeight: "50vh", overflow: "auto" }}>
          <Code block style={{ background: "transparent", color: "white", whiteSpace: "pre-wrap" }}>{stateDump()}</Code>
        </Paper>
      )}
      <Group data-prototype-bar gap={4} wrap="nowrap" p={4} style={{ ...pill, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        <Text size="xs" fw={500} px="sm" style={{ whiteSpace: "nowrap" }}><span style={{ opacity: 0.6 }}>Prototipo Mantine · </span>PT-04</Text>
        <Box w={1} h={16} bg="rgba(255,255,255,.25)" />
        <UnstyledButton px="sm" h={28} fz="xs" fw={500} c="white" style={{ borderRadius: 999 }} aria-pressed={S.showState} onClick={() => update(() => { S.showState = !S.showState; })}>{S.showState ? "Nascondi stato" : "Stato"}</UnstyledButton>
        <UnstyledButton px="sm" h={28} fz="xs" fw={500} c="white" opacity={0.7} style={{ borderRadius: 999 }}
          onClick={() => update(() => { S.plans = initialPlans(); S.planId = null; S.sel = null; S.draft = null; S.ui = initUi(); })}>Reset</UnstyledButton>
      </Group>
    </>
  );
}

export function App() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const update = (fn?: () => void) => { fn?.(); bump(); };
  return (
    <UpdateContext.Provider value={update}>
      <Header />
      <Box maw={1320} mx="auto" pb={96}><PlanConfiguration /></Box>
      <PrototypeBar update={update} />
    </UpdateContext.Provider>
  );
}

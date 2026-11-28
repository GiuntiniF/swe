// PROTOTIPO USA E GETTA. PT-08 nello stile scelto per PT-05: pagine separate (elenco, poi dettaglio atleta a tab).
// La barra in basso serve solo al prototipo: ha l'attributo data-prototype-bar, così gli screenshot la possono nascondere.
import { useReducer } from "react";
import { Avatar, Box, Code, Container, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconBarbell } from "@tabler/icons-react";
import { athlete, athletesOfPt, fullName } from "./domain";
import { S, UpdateContext, initUi } from "./store";
import { AthleteList } from "./AthleteList";
import { AthleteDetail } from "./AthleteDetail";

function stateDump() {
  const list = athletesOfPt(S.empty);
  const lines = [`Vista: ${S.ui.aView === "detail" ? `dettaglio atleta · tab ${S.ui.bTab}` : "elenco atleti"}`, ""];
  lines.push(S.empty ? "Atleti del PT: nessuno (flusso 2a)" : `Atleti del PT (${list.length}, per cognome):`);
  for (const a of list) {
    const d = a.assignments.filter((x) => x.status === "draft").length;
    lines.push(`  ${a.lastName.padEnd(10)} ${a.firstName.padEnd(8)} ${a.email.padEnd(24)} schede ${a.assignments.length}${d ? ` (${d} bozza)` : ""} · appuntamenti ${a.appointments.length}`);
  }
  lines.push("", `Atleta selezionato: ${S.ui.aView === "detail" && S.ui.selected ? fullName(athlete(S.ui.selected)) : "—"}`);
  return lines.join("\n");
}

function Header() {
  return (
    <Box component="header" mb="lg" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
      <Group h={56} maw={1320} mx="auto" gap="lg">
        <Group gap={6}><IconBarbell size={22} /><Text fw={700}>Area PT</Text></Group>
        <Group gap="md" visibleFrom="sm">
          {["Atleti", "Schede", "Palestre", "Appuntamenti"].map((n) => <Text key={n} size="sm" fw={n === "Atleti" ? 600 : 400} c={n === "Atleti" ? undefined : "dimmed"}>{n}</Text>)}
        </Group>
        <Avatar size="sm" radius="xl" ml="auto">PT</Avatar>
      </Group>
    </Box>
  );
}

function PrototypeBar({ update }: { update: (fn?: () => void) => void }) {
  const pill: React.CSSProperties = { position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 400, background: "var(--mantine-color-dark-9)", color: "white" };
  const btn = { px: "sm", h: 28, fz: "xs", fw: 500, c: "white", style: { borderRadius: 999, whiteSpace: "nowrap" as const } };
  return (
    <>
      {S.showState && (
        <Paper data-prototype-bar shadow="xl" radius="md" p="sm" style={{ ...pill, bottom: "calc(68px + env(safe-area-inset-bottom, 0px))", width: "min(720px, calc(100% - 32px))", maxHeight: "50vh", overflow: "auto" }}>
          <Code block style={{ background: "transparent", color: "white", whiteSpace: "pre-wrap" }}>{stateDump()}</Code>
        </Paper>
      )}
      <Group data-prototype-bar gap={4} wrap="nowrap" p={4} style={{ ...pill, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,.35)", maxWidth: "calc(100% - 32px)" }}>
        <Text size="xs" fw={500} px="sm" style={{ whiteSpace: "nowrap" }}><span style={{ opacity: 0.6 }}>Prototipo Mantine · </span>PT-08</Text>
        <Box w={1} h={16} bg="rgba(255,255,255,.25)" style={{ flexShrink: 0 }} />
        <UnstyledButton {...btn} aria-pressed={S.empty} bg={S.empty ? "rgba(255,255,255,.18)" : undefined}
          onClick={() => update(() => { S.empty = !S.empty; S.ui = initUi(); })}>{S.empty ? "Con atleti" : "Nessun atleta"}</UnstyledButton>
        <UnstyledButton {...btn} aria-pressed={S.showState} onClick={() => update(() => { S.showState = !S.showState; })}>{S.showState ? "Nascondi stato" : "Stato"}</UnstyledButton>
      </Group>
    </>
  );
}

export function App() {
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const update = (fn?: () => void) => { fn?.(); bump(); };
  const detail = S.ui.aView === "detail" && S.ui.selected && !S.empty;
  return (
    <UpdateContext.Provider value={update}>
      <Header />
      <Box maw={1320} mx="auto" pb={96}>
        <Container size="lg" px={0}>{detail ? <AthleteDetail /> : <AthleteList />}</Container>
      </Box>
      <PrototypeBar update={update} />
    </UpdateContext.Provider>
  );
}

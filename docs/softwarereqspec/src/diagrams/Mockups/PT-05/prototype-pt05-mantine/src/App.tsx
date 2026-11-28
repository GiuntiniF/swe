// PROTOTIPO USA E GETTA. Tre varianti Mantine di PT-05, da scorrere con la barra in basso o con i tasti ← →.
// La variante è nell'hash (#variante-a, #variante-b, #variante-c) o in ?variant=B.
import { useEffect, useReducer } from "react";
import { ActionIcon, Avatar, Box, Code, Group, Paper, Text, UnstyledButton } from "@mantine/core";
import { IconBarbell, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { endOf, fmt, initialAssignments, incompleteWeeks, periodStatus, plan, totals, TODAY, weekRanges } from "./domain";
import { sortedAssignments } from "./shared";
import { S, UpdateContext, type VariantHooks, initUi } from "./store";
import { VariantA, hooksA } from "./VariantA";
import { VariantB, hooksB } from "./VariantB";
import { VariantC, hooksC } from "./VariantC";

const VARIANTS: { key: string; slug: string; name: string; View: () => React.ReactNode; hooks: VariantHooks }[] = [
  { key: "A", slug: "variante-a", name: "Wizard a pagine", View: VariantA, hooks: hooksA },
  { key: "B", slug: "variante-b", name: "Pannello laterale", View: VariantB, hooks: hooksB },
  { key: "C", slug: "variante-c", name: "Matrice dei carichi", View: VariantC, hooks: hooksC },
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
  const lines = [`Variante ${v.key} (${v.name})${S.variant === 0 ? ` · vista: ${S.ui.aView}` : ""}`, "", `Schede dell'atleta (oggi = ${fmt(TODAY)}):`];
  for (const a of sortedAssignments())
    lines.push(`  #${a.id} ${plan(a.planId).name.padEnd(24)} ${fmt(a.start)} – ${fmt(endOf(a.planId, a.start))}  ${a.status === "draft" ? "BOZZA" : "confermata"} · ${periodStatus(a)}`);
  lines.push("", "Flusso in corso:");
  const f = S.flow;
  if (!f) lines.push("  nessuno");
  else {
    lines.push(`  assegnazione: ${f.id ? `#${f.id} (bozza salvata)` : "non ancora creata"}${f.resumed ? " · ripresa (flusso 2a)" : ""}`);
    lines.push(`  scheda: ${f.planId ? plan(f.planId).name : "—"} · inizio ${fmt(f.start)} · fine ${f.planId && f.start ? fmt(endOf(f.planId, f.start)) : "—"}`);
    if (f.planId) { const t = totals(f); const inc = incompleteWeeks(f); lines.push(`  carichi: ${t.filled}/${t.total} · week incomplete: ${inc.length ? weekRanges(inc) : "nessuna"}`); }
    lines.push(`  precompilati da confermare: ${f.pre.size}`);
    lines.push(`  errore: ${f.error ? f.error.type : "—"}`);
  }
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

function Switcher({ update }: { update: (fn?: () => void) => void }) {
  const v = VARIANTS[S.variant];
  const pill: React.CSSProperties = { position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 400, background: "var(--mantine-color-dark-9)", color: "white" };
  return (
    <>
      {S.showState && (
        <Paper data-prototype-bar shadow="xl" radius="md" p="sm" style={{ ...pill, bottom: "calc(68px + env(safe-area-inset-bottom, 0px))", width: "min(640px, calc(100% - 32px))", maxHeight: "50vh", overflow: "auto" }}>
          <Code block style={{ background: "transparent", color: "white", whiteSpace: "pre-wrap" }}>{stateDump()}</Code>
        </Paper>
      )}
      <Group data-prototype-bar gap={4} wrap="nowrap" p={4} style={{ ...pill, bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderRadius: 999, boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
        <ActionIcon radius="xl" variant="subtle" color="gray" c="white" aria-label="Variante precedente" onClick={() => go(S.variant - 1)}><IconChevronLeft size={16} /></ActionIcon>
        <Text size="xs" fw={500} px={4} style={{ whiteSpace: "nowrap" }}><span style={{ opacity: 0.6 }}>Prototipo Mantine · </span>{v.key} <span style={{ opacity: 0.7 }}>({v.name})</span></Text>
        <ActionIcon radius="xl" variant="subtle" color="gray" c="white" aria-label="Variante successiva" onClick={() => go(S.variant + 1)}><IconChevronRight size={16} /></ActionIcon>
        <Box w={1} h={16} bg="rgba(255,255,255,.25)" />
        <UnstyledButton px="sm" h={28} fz="xs" fw={500} c="white" style={{ borderRadius: 999 }} aria-pressed={S.showState} onClick={() => update(() => { S.showState = !S.showState; })}>{S.showState ? "Nascondi stato" : "Stato"}</UnstyledButton>
        <UnstyledButton px="sm" h={28} fz="xs" fw={500} c="white" opacity={0.7} style={{ borderRadius: 999 }}
          onClick={() => update(() => { S.assignments = initialAssignments(); S.nextId = 5; S.flow = null; S.ui = initUi(); })}>Reset</UnstyledButton>
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
      if (i !== S.variant) { S.variant = i; S.flow = null; S.ui = initUi(); }
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
      <Box maw={1320} mx="auto" pb={96}><View /></Box>
      <Switcher update={update} />
    </UpdateContext.Provider>
  );
}

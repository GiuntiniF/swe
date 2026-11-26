// PROTOTIPO USA E GETTA. Variante C: calendario delle schede + matrice dei carichi su una pagina.
import {
  ActionIcon, Alert, Avatar, Badge, Box, Button, Center, Container, Divider, Grid, Group, Paper, RingProgress, ScrollArea,
  SegmentedControl, Select, Stack, Table, Text, ThemeIcon, Title, Tooltip, UnstyledButton,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconArrowBarToRight, IconCheck, IconCircleX, IconCopy, IconCornerDownRight, IconDeviceFloppy, IconPlus, IconTableOptions,
  IconTrash,
} from "@tabler/icons-react";
import {
  type Assignment, ATHLETE, PLANS, SESSIONS, TODAY, addDays, blockOfWeek, daysBetween, dropValue, endOf, firstFreeDay,
  flowFromDraft, fmt, kg, newFlow, overlapFor, periodStatus, plan, prefillWeek, totals, weeksOf,
} from "./domain";
import { FlowAlert, LoadInput, WeekDot } from "./shared";
import { type VariantHooks, S, askDiscard, flow, notifyOutOfScope, saveDraft, submit, useUpdate } from "./store";

export const hooksC: VariantHooks = {
  resume(a) { S.flow = flowFromDraft(a); S.ui.cOpen = true; },
  leave() { S.flow = null; S.ui.cOpen = false; },
  done(a) {
    S.flow = null; S.ui.cOpen = false;
    notifications.show({ title: "Scheda assegnata", message: `"${plan(a.planId).name}" dal ${fmt(a.start)}. Email di notifica inviata a ${ATHLETE.email}.`, color: "green", icon: <IconCheck size={16} /> });
  },
};

const T0 = "2026-01-01", T1 = "2027-06-30";
const pct = (iso: string) => Math.max(0, Math.min(100, (daysBetween(T0, iso) / daysBetween(T0, T1)) * 100));

function Timeline() {
  const update = useUpdate();
  const f = S.ui.cOpen ? S.flow : null;
  const months: string[] = [];
  for (let d = T0; d <= T1;) {
    months.push(d);
    const [y, m] = d.split("-").map(Number);
    d = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  }
  const bar = (a: Pick<Assignment, "planId" | "start"> & { id?: number }, lane: number, style: React.CSSProperties) => {
    const e = endOf(a.planId, a.start);
    const l = pct(a.start), r = pct(addDays(e, 1));
    return (
      <Tooltip key={(a.id ?? "new") + "-" + lane} label={`${plan(a.planId).name}: ${fmt(a.start)} – ${fmt(e)}`} withArrow>
        <UnstyledButton
          onClick={() => {
            const x = S.assignments.find((y) => y.id === a.id);
            if (!x) return;
            if (x.status === "draft") update(() => hooksC.resume(x));
            else notifyOutOfScope("Apri la scheda", "Il dettaglio della scheda non fa parte di questo prototipo.");
          }}
          style={{ position: "absolute", top: lane * 36 + 4, left: `calc(${l}% + 1px)`, width: `calc(${r - l}% - 2px)`, height: 28, borderRadius: 6, padding: "0 8px", fontSize: 12, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", ...style }}>
          {plan(a.planId).name}
        </UnstyledButton>
      </Tooltip>
    );
  };
  const ghost = f && f.planId && f.start
    ? bar({ planId: f.planId, start: f.start }, 2, overlapFor(S.assignments, f.start, endOf(f.planId, f.start), f.id)
      ? { background: "var(--mantine-color-red-light)", color: "var(--mantine-color-red-light-color)", border: "1px solid var(--mantine-color-red-filled)" }
      : { background: "var(--mantine-color-green-light)", color: "var(--mantine-color-green-light-color)", border: "1px solid var(--mantine-color-green-filled)" })
    : null;
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" mb="sm">
        <div><Title order={4}>Calendario delle schede</Title><Text size="sm" c="dimmed">Le bozze non occupano il calendario: la sovrapposizione si controlla solo con le schede confermate.</Text></div>
        <Group gap="md">
          <Badge variant="filled" color="blue">Confermata</Badge>
          <Badge variant="outline" color="yellow" style={{ borderStyle: "dashed" }}>Bozza</Badge>
          <Badge variant="light" color="green">Nuova</Badge>
        </Group>
      </Group>
      <Group wrap="nowrap" align="flex-start" gap={0}>
        <Stack gap={0} w={96} pt={24} style={{ flexShrink: 0 }}>
          {["Confermate", "Bozze", f ? (f.resumed ? "In modifica" : "Nuova") : ""].map((l) => <Text key={l} size="xs" c="dimmed" h={36} style={{ display: "flex", alignItems: "center" }}>{l}</Text>)}
        </Stack>
        <ScrollArea style={{ flex: 1 }} type="auto">
          <Box pos="relative" miw={720} h={24 + 3 * 36}>
            {months.map((m) => (
              <Box key={m} pos="absolute" top={0} bottom={0} style={{ left: `${pct(m)}%`, borderLeft: "1px dashed var(--mantine-color-default-border)" }}>
                <Text size="xs" c="dimmed" pl={4}>{new Date(m + "T00:00:00Z").toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" })}{m.slice(5, 7) === "01" ? ` ${m.slice(0, 4)}` : ""}</Text>
              </Box>
            ))}
            <Box pos="absolute" top={20} bottom={0} w={1} bg="red" style={{ left: `${pct(TODAY)}%` }}>
              <Text size="xs" c="red" fw={600} pos="absolute" bottom={0} left={4}>oggi</Text>
            </Box>
            <Box pos="absolute" top={24} left={0} right={0} bottom={0}>
              {S.assignments.filter((a) => !(f && a.id === f.id)).map((a) => a.status === "draft"
                ? bar(a, 1, { border: "2px dashed var(--mantine-color-yellow-filled)", background: "var(--mantine-color-yellow-light)", color: "var(--mantine-color-yellow-light-color)" })
                : bar(a, 0, {
                  background: periodStatus(a) === "Terminata" ? "var(--mantine-color-gray-light)" : "var(--mantine-color-blue-filled)",
                  color: periodStatus(a) === "Terminata" ? "var(--mantine-color-text)" : "white",
                  outline: S.ui.highlight === a.id ? "2px solid var(--mantine-color-green-filled)" : undefined, outlineOffset: 2,
                }))}
              {ghost}
            </Box>
          </Box>
        </ScrollArea>
      </Group>
    </Paper>
  );
}

function Side() {
  const update = useUpdate();
  const f = flow();
  const p = f.planId ? plan(f.planId) : null;
  const end = p && f.start ? endOf(f.planId!, f.start) : null;
  const o = end ? overlapFor(S.assignments, f.start, end, f.id) : undefined;
  const t = p ? totals(f) : null;
  const ready = !!(p && f.start && !o);
  const free = firstFreeDay(S.assignments);
  const done = t ? Math.round((t.filled / t.total) * 100) : 0;
  return (
    <Paper withBorder radius="md" p="md" style={{ position: "sticky", top: 16 }}>
      <Stack>
        <Group justify="space-between"><Title order={4}>{f.resumed ? "Bozza" : "Nuova assegnazione"}</Title>{f.id && <Badge variant="light" color="yellow">Bozza</Badge>}</Group>
        <Select label="Scheda" placeholder="Scegli una scheda" value={f.planId} disabled={f.resumed} allowDeselect={false}
          data={PLANS.map((x) => ({ value: x.id, label: x.unconfigured ? `${x.name} (non configurata)` : `${x.name} · ${weeksOf(x)} sett.`, disabled: !!x.unconfigured }))}
          description={PLANS.some((x) => x.unconfigured) ? "Le schede non configurate si completano con il caso d'uso PT-04." : undefined}
          onChange={(v) => update(() => { f.planId = v; f.loads = {}; f.pre = new Set(); })} />
        {!f.resumed && <Button variant="subtle" size="xs" leftSection={<IconPlus size={14} />} style={{ alignSelf: "flex-start" }}
          onClick={() => notifyOutOfScope("Crea scheda ad hoc", "Il flusso continua con PT-03 e PT-04 e poi torna al passo 5. Non fa parte di questo prototipo.")}>Crea scheda ad hoc</Button>}
        {p && <DateInput label="Data di inizio" valueFormat="DD/MM/YYYY" placeholder="gg/mm/aaaa" value={f.start || null}
          presets={[{ value: free, label: "Primo giorno libero" }]} description={`Primo giorno libero: ${fmt(free)}`}
          onChange={(v) => update(() => { f.start = v ?? ""; f.error = null; })} />}
        {p && <Group justify="space-between"><Text size="sm" c="dimmed">Data di fine</Text><Text size="sm" fw={600}>{end ? fmt(end) : "—"}</Text></Group>}
        {o && <Alert color="red" variant="light" icon={<IconCircleX />} title="Date sovrapposte">Si sovrappone a "{plan(o.planId).name}" ({fmt(o.start)} – {fmt(endOf(o.planId, o.start))}).</Alert>}
        {f.error?.type === "missing" && <FlowAlert />}
        {t && (<>
          <Divider />
          <Group wrap="nowrap">
            <RingProgress size={72} thickness={7} roundCaps sections={[{ value: done, color: done === 100 ? "green" : "blue" }]} label={<Text ta="center" size="xs" fw={700}>{done}%</Text>} />
            <div><Text size="sm" fw={600}>{t.filled} / {t.total} carichi</Text><Text size="xs" c="dimmed">Servono tutti per confermare. La bozza si salva anche incompleta.</Text></div>
          </Group>
        </>)}
        <Stack gap="xs">
          <Button fullWidth leftSection={<IconCheck size={16} />} disabled={!ready} onClick={() => update(() => submit(hooksC))}>Assegna Scheda</Button>
          <Button fullWidth variant="light" leftSection={<IconDeviceFloppy size={16} />} disabled={!ready} onClick={() => update(() => saveDraft(hooksC))}>Salva e continua dopo</Button>
          {f.id && <Button fullWidth variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => askDiscard(f.id!, hooksC, update)}>Scarta la bozza</Button>}
          <Button fullWidth variant="subtle" color="gray" onClick={() => update(() => hooksC.leave())}>Chiudi</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function Matrix() {
  const update = useUpdate();
  const f = flow();
  if (!f.planId || !f.start)
    return (
      <Paper withBorder radius="md" p="xl">
        <Center><Stack align="center" gap="xs" maw={360} ta="center">
          <ThemeIcon variant="light" size={48} radius="xl"><IconTableOptions size={26} /></ThemeIcon>
          <Title order={4}>Matrice dei carichi</Title>
          <Text size="sm" c="dimmed">Scegli una scheda e la data di inizio: qui compare una riga per ogni esercizio e una colonna per ogni week.</Text>
        </Stack></Center>
      </Paper>
    );
  const p = plan(f.planId);
  const s = SESSIONS.find((x) => x.id === f.session)!;
  const weeks = Array.from({ length: weeksOf(p) }, (_, i) => i + 1);
  const sep = (w: number) => (blockOfWeek(p, w).inBlock === 1 ? { borderLeft: "2px solid var(--mantine-color-default-border)" } : undefined);
  const sticky: React.CSSProperties = { position: "sticky", left: 0, zIndex: 2, background: "var(--mantine-color-body)", minWidth: 210 };
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm">
        <div><Title order={4}>Carichi (kg)</Title><Text size="sm" c="dimmed">Un valore per esercizio e per week. I valori in corsivo sono copiati dalla week precedente.</Text></div>
        <SegmentedControl value={f.session} onChange={(v) => update(() => { f.session = v; })} data={SESSIONS.map((x) => ({ value: x.id, label: `${x.name} · ${x.focus}` }))} />
      </Group>
      <Button size="xs" variant="default" leftSection={<IconCopy size={14} />} mb="sm"
        onClick={() => update(() => { const ids = s.rows.map((r) => r.id); for (let w = 2; w <= weeks.length; w++) prefillWeek(f, w, ids); })}>
        Precompila le celle vuote di {s.name}
      </Button>
      <Table.ScrollContainer minWidth={210 + weeks.length * 72}>
        <Table withTableBorder verticalSpacing={4} horizontalSpacing={4}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th rowSpan={2} style={sticky}><Text size="xs" c="dimmed">Esercizio</Text></Table.Th>
              {p.blocks.map((n, i) => <Table.Th key={i} colSpan={n} ta="center" style={{ borderLeft: "2px solid var(--mantine-color-default-border)" }}><Text size="xs" c="dimmed">Blocco {i + 1}</Text></Table.Th>)}
            </Table.Tr>
            <Table.Tr>{weeks.map((w) => <Table.Th key={w} ta="center" style={sep(w)}><Text size="xs" c="dimmed">W{w}</Text></Table.Th>)}</Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {s.rows.flatMap((r) => [
              <Table.Tr key={r.id}>
                <Table.Td style={sticky}>
                  <Group justify="space-between" wrap="nowrap" gap={4}>
                    <div style={{ minWidth: 0 }}><Text size="sm" fw={500} truncate>{r.name}</Text><Text size="xs" c="dimmed">{r.sets} · {r.rest}{r.superset ? ` · Superset ${r.superset}` : ""}</Text></div>
                    <Tooltip label={`Copia i carichi di ${r.name} nelle week vuote successive`} withArrow>
                      <ActionIcon variant="subtle" color="gray" aria-label="Propaga" onClick={() => update(() => { for (let w = 2; w <= weeks.length; w++) prefillWeek(f, w, [r.id]); })}><IconArrowBarToRight size={16} /></ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
                {weeks.map((w) => <Table.Td key={w} style={sep(w)}><LoadInput w={w} ex={r.id} width={64} compact /></Table.Td>)}
              </Table.Tr>,
              ...(r.drop ? [
                <Table.Tr key={r.id + "-drop"} bg="var(--mantine-color-default-hover)">
                  <Table.Td style={{ ...sticky, background: "var(--mantine-color-default-hover)" }}><Group gap={4} c="dimmed"><IconCornerDownRight size={14} /><Text size="xs">Drop-set × {kg(r.drop)} (calcolato)</Text></Group></Table.Td>
                  {weeks.map((w) => { const d = dropValue(f, w, r); return <Table.Td key={w} ta="center" style={sep(w)}><Text size="xs" c="dimmed">{d === null ? "—" : kg(d)}</Text></Table.Td>; })}
                </Table.Tr>,
              ] : []),
            ])}
            <Table.Tr>
              <Table.Td style={sticky}><Text size="xs" c="dimmed">Week completa</Text></Table.Td>
              {weeks.map((w) => <Table.Td key={w} ta="center" style={sep(w)}><WeekDot w={w} /></Table.Td>)}
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}

export function VariantC() {
  const update = useUpdate();
  return (
    <Container size="xl" px={0}>
      <Stack gap="lg">
        <Group wrap="wrap">
          <Avatar size="lg" radius="xl" color="teal">{ATHLETE.initials}</Avatar>
          <div style={{ flex: 1, minWidth: 160 }}><Text size="sm" c="dimmed">Atleti /</Text><Title order={2}>{ATHLETE.name}</Title></div>
          <Group gap="xl" visibleFrom="md">
            {[["Email", ATHLETE.email], ["Età", String(ATHLETE.age)], ["Fisico", `${ATHLETE.height} cm · ${ATHLETE.weight} kg`], ["Palestra", ATHLETE.gyms[0]]].map(([k, v]) => (
              <div key={k}><Text size="xs" c="dimmed">{k}</Text><Text size="sm" fw={500}>{v}</Text></div>
            ))}
          </Group>
          {!S.ui.cOpen && <Button leftSection={<IconPlus size={16} />} onClick={() => update(() => { S.flow = newFlow(); S.ui.highlight = null; S.ui.cOpen = true; })}>Assegna nuova Scheda</Button>}
        </Group>
        <Timeline />
        {S.ui.cOpen && (
          <Grid gap="md" align="flex-start">
            <Grid.Col span={{ base: 12, lg: 4 }}><Side /></Grid.Col>
            <Grid.Col span={{ base: 12, lg: 8 }} style={{ minWidth: 0 }}><Matrix /></Grid.Col>
          </Grid>
        )}
      </Stack>
    </Container>
  );
}

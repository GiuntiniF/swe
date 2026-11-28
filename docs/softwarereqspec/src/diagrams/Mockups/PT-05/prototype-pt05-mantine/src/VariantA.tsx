// PROTOTIPO USA E GETTA. Variante A: wizard a pagine, stessa struttura dei mockup Salt.
import {
  Alert, Anchor, Badge, Breadcrumbs, Button, Container, Group, Paper, Progress, SegmentedControl, Stack, Stepper, Tabs, Text, ThemeIcon, Title, UnstyledButton,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconAlertTriangle, IconCheck, IconChevronLeft, IconChevronRight, IconCircleCheck, IconCopy, IconDeviceFloppy,
  IconMail, IconPlus, IconStack2,
} from "@tabler/icons-react";
import {
  ATHLETE, EX_IDS, PLANS, SESSIONS, blockOfWeek, endOf, firstFreeDay, flowFromDraft, fmtLong, key,
  newFlow, plan, planSub, prefillWeek, totals, weeksOf, weeksOfBlock,
} from "./domain";
import { FlowAlert, SessionTable, WeekBadge, WeekDot } from "./shared";
import { AthleteDetail } from "./AthleteDetail";
import { type VariantHooks, S, continueToLoads, flow, notifyOutOfScope, saveDraft, submit, useUpdate } from "./store";

export const hooksA: VariantHooks = {
  resume(a) { S.flow = flowFromDraft(a); S.ui.aView = "loads"; },
  leave() { S.flow = null; S.ui.aView = "detail"; },
  done(a) { S.flow = null; S.ui.doneId = a.id; S.ui.aView = "done"; S.ui.bTab = "schede"; },
};

function Crumbs({ extra }: { extra?: string }) {
  const update = useUpdate();
  return (
    <Breadcrumbs>
      <Text size="sm" c="dimmed">Atleti</Text>
      {extra ? <Anchor size="sm" component="button" onClick={() => update(() => { S.flow = null; S.ui.aView = "detail"; })}>Mario Rossi</Anchor> : <Text size="sm">Mario Rossi</Text>}
      {extra && <Text size="sm">{extra}</Text>}
    </Breadcrumbs>
  );
}
function WizardHead({ step }: { step: number }) {
  const f = S.flow;
  return (
    <Stack gap="lg">
      <Crumbs extra={f?.resumed ? "Riprendi la bozza" : "Assegna nuova Scheda"} />
      <Title order={2}>{f?.resumed ? "Riprendi la bozza" : "Assegna nuova Scheda"}</Title>
      <Stepper active={step} size="sm">
        <Stepper.Step label="Scheda" description="Scegli la scheda" />
        <Stepper.Step label="Date" description="Inizio e fine" />
        <Stepper.Step label="Carichi" description="Per ogni week" />
      </Stepper>
    </Stack>
  );
}

function Detail() {
  return (
    <Stack gap="lg">
      <Crumbs />
      <AthleteDetail hooks={hooksA} onNew={() => { S.flow = newFlow(); S.ui.highlight = null; S.ui.aView = "plans"; }} />
    </Stack>
  );
}

function Plans() {
  const update = useUpdate();
  const f = flow();
  const n = f.notice ? plan(f.notice) : null;
  return (
    <Stack gap="lg">
      <WizardHead step={0} />
      {n && <Alert color="red" variant="light" icon={<IconAlertTriangle />} title="La scheda non è configurata">"{n.name}": {n.unconfigured!.charAt(0).toLowerCase() + n.unconfigured!.slice(1)} Completala con il caso d'uso PT-04, poi assegnala.</Alert>}
      <Paper withBorder radius="md">
        {PLANS.map((p, i) => (
          <UnstyledButton key={p.id} w="100%" px="md" py="sm" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}
            onClick={() => update(() => { if (p.unconfigured) { f.notice = p.id; return; } f.notice = null; f.planId = p.id; S.ui.aView = "dates"; })}>
            <Group wrap="nowrap">
              <ThemeIcon variant="light" color={p.unconfigured ? "yellow" : "blue"} size="lg"><IconStack2 size={18} /></ThemeIcon>
              <div style={{ flex: 1 }}><Text fw={500}>{p.name}</Text><Text size="sm" c="dimmed">{planSub(p)}</Text></div>
              {p.unconfigured ? <Badge color="yellow" variant="light">Non configurata</Badge> : <Badge color="green" variant="light">Configurata</Badge>}
              <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
            </Group>
          </UnstyledButton>
        ))}
      </Paper>
      <Group justify="space-between">
        <Button variant="default" onClick={() => update(() => { S.flow = null; S.ui.aView = "detail"; })}>Annulla</Button>
        <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => notifyOutOfScope("Crea scheda ad hoc", "Il flusso continua con PT-03 e PT-04 e poi torna al passo 5. Non fa parte di questo prototipo.")}>Crea scheda ad hoc</Button>
      </Group>
    </Stack>
  );
}

function Dates() {
  const update = useUpdate();
  const f = flow();
  const p = plan(f.planId!);
  const free = firstFreeDay(S.assignments);
  return (
    <Stack gap="lg">
      <WizardHead step={1} />
      <Paper withBorder radius="md" p="lg" maw={560}>
        <Stack>
          <div><Text size="sm" c="dimmed">Scheda</Text><Text fw={600}>{p.name}</Text><Text size="sm" c="dimmed">{weeksOf(p)} settimane · {p.blocks.length} blocchi mensili da {p.blocks.join(" + ")} settimane</Text></div>
          <DateInput label="Data di inizio" description={`Primo giorno libero: ${fmtLong(free)}`} placeholder="gg/mm/aaaa" valueFormat="DD/MM/YYYY"
            value={f.start || null} presets={[{ value: free, label: "Primo giorno libero" }]}
            onChange={(v) => update(() => { f.start = v ?? ""; f.error = null; })} maw={260} />
          <div><Text size="sm" fw={500}>Data di fine</Text><Text size="sm">{f.start ? fmtLong(endOf(f.planId!, f.start)) : "Inserisci la data di inizio"}</Text><Text size="xs" c="dimmed">Calcolata dalla data di inizio e dal numero di blocchi mensili.</Text></div>
          <FlowAlert />
          <Group justify="space-between" mt="sm">
            <Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => update(() => { S.ui.aView = "plans"; })}>Indietro</Button>
            <Button rightSection={<IconChevronRight size={16} />} disabled={!f.start} onClick={() => update(() => { if (continueToLoads()) S.ui.aView = "loads"; })}>Continua</Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

function Loads() {
  const update = useUpdate();
  const f = flow();
  const p = plan(f.planId!);
  const t = totals(f);
  const { block } = blockOfWeek(p, f.week);
  const pre = EX_IDS.some((ex) => f.pre.has(key(f.week, ex)));
  const goWeek = (w: number) => update(() => { f.week = w; prefillWeek(f, w); });
  const toDates = () => update(() => { f.error = null; S.ui.aView = "dates"; });
  return (
    <Stack gap="lg">
      <WizardHead step={2} />
      <Group justify="space-between" align="flex-end">
        <div><Group gap="xs"><Text fw={600}>{p.name}</Text><Badge variant="light" color="yellow">Bozza</Badge></Group><Text size="sm" c="dimmed">{fmtLong(f.start)} → {fmtLong(endOf(f.planId!, f.start))}</Text></div>
        <Stack gap={4} w={{ base: "100%", sm: 260 }}>
          <Group justify="space-between"><Text size="sm" c="dimmed">Carichi inseriti</Text><Text size="sm" fw={600}>{t.filled} / {t.total}</Text></Group>
          <Progress value={(t.filled / t.total) * 100} />
        </Stack>
      </Group>
      <FlowAlert onDates={toDates} />
      <Tabs value={String(block)} onChange={(v) => v && goWeek(weeksOfBlock(p, +v)[0])}>
        <Tabs.List>{p.blocks.map((_, i) => <Tabs.Tab key={i} value={String(i + 1)}>Blocco {i + 1}</Tabs.Tab>)}</Tabs.List>
      </Tabs>
      <SegmentedControl value={String(f.week)} onChange={(v) => goWeek(+v)} style={{ alignSelf: "flex-start" }}
        data={weeksOfBlock(p, block).map((w) => ({ value: String(w), label: <Group gap={6} wrap="nowrap" justify="center"><span>Week {w}</span><WeekDot w={w} /></Group> }))} />
      <Group gap="sm">
        <Title order={3}>Week {f.week}</Title><WeekBadge w={f.week} />
        {pre && <Text size="sm" c="dimmed"><IconCopy size={14} style={{ verticalAlign: -2 }} /> Precompilata dalla week {f.week - 1}: controlla i carichi in corsivo.</Text>}
      </Group>
      {SESSIONS.map((s) => (
        <Paper key={s.id} withBorder radius="md" p="md">
          <Text fw={600} mb="xs">{s.name} · {s.focus}</Text>
          <SessionTable s={s} w={f.week} />
        </Paper>
      ))}
      <Group>
        <Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={toDates}>Indietro</Button>
        <div style={{ flex: 1 }} />
        <Button variant="light" leftSection={<IconDeviceFloppy size={16} />} onClick={() => update(() => saveDraft(hooksA))}>Salva e continua dopo</Button>
        <Button leftSection={<IconCheck size={16} />} onClick={() => update(() => submit(hooksA))}>Assegna Scheda</Button>
      </Group>
    </Stack>
  );
}

function Done() {
  const update = useUpdate();
  const a = S.assignments.find((x) => x.id === S.ui.doneId)!;
  return (
    <Stack gap="lg">
      <Crumbs extra="Assegna nuova Scheda" />
      <Stepper active={3} size="sm">
        <Stepper.Step label="Scheda" /><Stepper.Step label="Date" /><Stepper.Step label="Carichi" />
      </Stepper>
      <Paper withBorder radius="md" p="xl" maw={520} mx="auto" ta="center">
        <Stack align="center">
          <ThemeIcon size={56} radius="xl" color="green" variant="light"><IconCircleCheck size={34} /></ThemeIcon>
          <Title order={2}>Scheda assegnata</Title>
          <Text c="dimmed">"{plan(a.planId).name}" è assegnata a {ATHLETE.name} dal {fmtLong(a.start)} al {fmtLong(endOf(a.planId, a.start))}.</Text>
          <Alert variant="light" color="blue" icon={<IconMail />} title="Email inviata" ta="left" w="100%">Abbiamo avvisato {ATHLETE.name} all'indirizzo {ATHLETE.email}.</Alert>
          <Group grow w="100%">
            <Button onClick={() => update(() => { S.ui.aView = "detail"; })}>Torna all'atleta</Button>
            <Button variant="default" onClick={() => notifyOutOfScope("Apri la scheda", "Il dettaglio della scheda non fa parte di questo prototipo.")}>Apri la scheda</Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

export function VariantA() {
  const View = { detail: Detail, plans: Plans, dates: Dates, loads: Loads, done: Done }[S.ui.aView];
  return <Container size="lg" px={0}><View /></Container>;
}

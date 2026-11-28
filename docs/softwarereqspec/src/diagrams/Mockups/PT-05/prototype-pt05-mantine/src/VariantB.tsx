// PROTOTIPO USA E GETTA. Variante B: pannello laterale (Drawer) sopra il dettaglio atleta.
import {
  Accordion, Anchor, Badge, Box, Breadcrumbs, Button, Container, Drawer, Group, Paper, Progress, Radio,
  Stack, Text, Title, } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import {
  IconAlertTriangle, IconCheck, IconChevronRight, IconCircleCheck, IconCopy, IconCornerDownRight,
  IconDeviceFloppy, IconPencil, } from "@tabler/icons-react";
import {
  ATHLETE, EX_IDS, PLANS, SESSIONS, addDays, dropValue, endOf, firstFreeDay, flowFromDraft, fmt, fmtLong,
  key, kg, newFlow, overlapFor, plan, planSub, prefillWeek, totals, weeksOf, weeksOfBlock,
} from "./domain";
import { FlowAlert, LoadInput, WeekBadge } from "./shared";
import { AthleteDetail } from "./AthleteDetail";
import { type VariantHooks, S, continueToLoads, flow, notifyOutOfScope, saveDraft, submit, useUpdate } from "./store";
import { notifications } from "@mantine/notifications";

export const hooksB: VariantHooks = {
  resume(a) { S.flow = flowFromDraft(a); S.ui.bSheet = true; S.ui.bPhase = "loads"; S.ui.bTab = "schede"; },
  leave() { S.flow = null; S.ui.bSheet = false; },
  done(a) {
    S.flow = null; S.ui.bSheet = false; S.ui.bTab = "schede";
    notifications.show({ title: "Scheda assegnata", message: `"${plan(a.planId).name}" dal ${fmt(a.start)}. Email di notifica inviata a ${ATHLETE.email}.`, color: "green", icon: <IconCheck size={16} /> });
  },
};

function Page() {
  return (
    <Stack gap="lg">
      <Breadcrumbs><Text size="sm" c="dimmed">Atleti</Text><Text size="sm">Mario Rossi</Text></Breadcrumbs>
      <AthleteDetail hooks={hooksB} onNew={() => { S.flow = newFlow(); S.ui.highlight = null; S.ui.bSheet = true; S.ui.bPhase = "setup"; }} />
    </Stack>
  );
}

/** Calendario con i giorni occupati dalle schede confermate e l'intervallo della nuova assegnazione. */
function DatesCalendar() {
  const update = useUpdate();
  const f = flow();
  const end = f.start ? endOf(f.planId!, f.start) : null;
  const busy = S.assignments.filter((a) => a.status === "confirmed" && a.id !== f.id).map((a) => [a.start, endOf(a.planId, a.start)] as const);
  const free = firstFreeDay(S.assignments);
  return (
    <Stack gap="xs">
    <Button size="xs" variant="default" style={{ alignSelf: "flex-start" }} onClick={() => update(() => { f.start = free; f.error = null; S.ui.bCal++; })}>
      Primo giorno libero: {fmtLong(free)}
    </Button>
    <DatePicker
      key={S.ui.bCal}
      numberOfColumns={2}
      size="sm"
      value={f.start || null}
      defaultDate={f.start || free}
      onChange={(v) => update(() => { f.start = v ?? ""; f.error = null; })}
      getDayProps={(d) => {
        const isBusy = busy.some(([s, e]) => d >= s && d <= e);
        const inNew = !!(f.start && end && d >= f.start && d <= end);
        return {
          inRange: inNew,
          firstInRange: d === f.start,
          lastInRange: d === end,
          style: isBusy ? { background: inNew ? "var(--mantine-color-red-filled)" : "var(--mantine-color-red-light)", color: inNew ? "white" : "var(--mantine-color-red-light-color)" } : undefined,
        };
      }}
    />
    </Stack>
  );
}

function Setup() {
  const update = useUpdate();
  const f = flow();
  const end = f.planId && f.start ? endOf(f.planId, f.start) : null;
  const o = end ? overlapFor(S.assignments, f.start, end, f.id) : undefined;
  return (
    <Stack gap="lg">
      <Stack gap="xs">
        <Text fw={600} size="sm">1. Scheda</Text>
        <Radio.Group value={f.planId} onChange={(v) => update(() => { const p = plan(v); if (p.unconfigured) { f.notice = p.id; return; } if (f.resumed) return; f.notice = null; f.planId = v; })}>
          <Stack gap="xs">
            {PLANS.map((p) => (
              <div key={p.id}>
                <Radio.Card value={p.id} radius="md" p="sm" opacity={p.unconfigured ? 0.7 : 1}>
                  <Group wrap="nowrap">
                    <Radio.Indicator />
                    <div style={{ flex: 1 }}><Text size="sm" fw={500}>{p.name}</Text><Text size="xs" c="dimmed">{planSub(p)}</Text></div>
                    {p.unconfigured && <Badge color="yellow" variant="light">Non configurata</Badge>}
                  </Group>
                </Radio.Card>
                {f.notice === p.id && <Text size="xs" c="red" mt={4}><IconAlertTriangle size={12} style={{ verticalAlign: -1 }} /> La scheda non è configurata: completala con il caso d'uso PT-04. {p.unconfigured}</Text>}
              </div>
            ))}
          </Stack>
        </Radio.Group>
        <Anchor size="sm" component="button" onClick={() => notifyOutOfScope("Crea scheda ad hoc", "Il flusso continua con PT-03 e PT-04 e poi torna al passo 5. Non fa parte di questo prototipo.")} style={{ alignSelf: "flex-start" }}>+ Crea scheda ad hoc</Anchor>
      </Stack>
      {f.planId && (
        <Stack gap="xs">
          <Text fw={600} size="sm">2. Date</Text>
          <Text size="xs" c="dimmed">In rosso i giorni già occupati da schede confermate. L'intervallo evidenziato è la nuova scheda ({weeksOf(plan(f.planId))} settimane).</Text>
          <DatesCalendar />
          <Group gap="xl">
            <div><Text size="xs" c="dimmed">Inizio</Text><Text fw={600}>{f.start ? fmt(f.start) : "—"}</Text></div>
            <div><Text size="xs" c="dimmed">Fine</Text><Text fw={600}>{end ? fmt(end) : "—"}</Text></div>
          </Group>
          {f.start && (o
            ? <Text size="sm" c="red">"{plan(o.planId).name}" va dal {fmt(o.start)} al {fmt(endOf(o.planId, o.start))}. Scegli una data di inizio dal {fmt(addDays(endOf(o.planId, o.start), 1))} in poi.</Text>
            : <Text size="sm" c="green"><IconCircleCheck size={14} style={{ verticalAlign: -2 }} /> Nessuna sovrapposizione con le schede confermate.</Text>)}
        </Stack>
      )}
    </Stack>
  );
}

function LoadsPhase() {
  const update = useUpdate();
  const f = flow();
  const p = plan(f.planId!);
  const t = totals(f);
  const toSetup = () => update(() => { f.error = null; S.ui.bPhase = "setup"; });
  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md" bg="var(--mantine-color-default-hover)">
        <Group justify="space-between" align="flex-start">
          <div><Group gap={6}><Text fw={600}>{p.name}</Text><Badge size="sm" variant="light" color="yellow">Bozza</Badge></Group><Text size="sm" c="dimmed">{fmt(f.start)} – {fmt(endOf(f.planId!, f.start))}</Text></div>
          <Button size="xs" variant="subtle" leftSection={<IconPencil size={14} />} onClick={toSetup}>Modifica date</Button>
        </Group>
        <Group justify="space-between" mt="sm"><Text size="xs" c="dimmed">Carichi inseriti</Text><Text size="xs" fw={600}>{t.filled} / {t.total}</Text></Group>
        <Progress value={(t.filled / t.total) * 100} size="sm" mt={4} />
      </Paper>
      <FlowAlert onDates={toSetup} />
      {p.blocks.map((_, b) => (
        <div key={b}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>Blocco {b + 1}</Text>
          <Accordion variant="separated" value={f.week ? String(f.week) : null}
            onChange={(v) => update(() => { f.week = v ? +v : 0; if (f.week) prefillWeek(f, f.week); })}>
            {weeksOfBlock(p, b + 1).map((w) => {
              const pre = EX_IDS.some((ex) => f.pre.has(key(w, ex)));
              return (
                <Accordion.Item key={w} value={String(w)}>
                  <Accordion.Control><Group justify="space-between" pr="sm"><Text fw={500} size="sm">Week {w}</Text><WeekBadge w={w} /></Group></Accordion.Control>
                  <Accordion.Panel>
                    {pre && <Text size="xs" c="dimmed" mb="xs"><IconCopy size={12} style={{ verticalAlign: -1 }} /> Precompilata dalla week {w - 1}. I valori in corsivo sono da controllare.</Text>}
                    <Stack gap="sm">
                      {SESSIONS.map((s) => (
                        <div key={s.id}>
                          <Text size="xs" fw={700} c="dimmed" mb={4}>{s.name} · {s.focus}</Text>
                          <Stack gap={6}>
                            {s.rows.map((r) => {
                              const d = r.drop ? dropValue(f, w, r) : null;
                              return (
                                <div key={r.id}>
                                  <Group justify="space-between" wrap="nowrap">
                                    <div style={{ minWidth: 0 }}>
                                      <Group gap={6}><Text size="sm" fw={500}>{r.name}</Text>{r.superset && <Badge size="xs" variant="outline" color="gray">Superset {r.superset}</Badge>}</Group>
                                      <Text size="xs" c="dimmed">{r.sets} · recupero {r.rest}</Text>
                                    </div>
                                    <LoadInput w={w} ex={r.id} />
                                  </Group>
                                  {r.drop && <Group gap={4} c="dimmed" mt={2} pl="xs"><IconCornerDownRight size={12} /><Text size="xs">Drop-set × {kg(r.drop)} · {d === null ? "—" : `${kg(d)} kg`} calcolati</Text></Group>}
                                </div>
                              );
                            })}
                          </Stack>
                        </div>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </div>
      ))}
    </Stack>
  );
}

function Sheet() {
  const update = useUpdate();
  const f = S.flow;
  if (!f) return null;
  const loads = S.ui.bPhase === "loads";
  const ok = !!(f.planId && f.start && !overlapFor(S.assignments, f.start, endOf(f.planId, f.start), f.id));
  const close = () => update(() => { S.flow = null; S.ui.bSheet = false; });
  return (
    <Drawer opened onClose={close} position="right" size={640} padding="lg"
      title={<div><Title order={3}>{f.resumed ? "Riprendi la bozza" : "Assegna nuova Scheda"}</Title><Text size="sm" c="dimmed">{ATHLETE.name} · {ATHLETE.email}</Text></div>}>
        <Box pb="md">{loads ? <LoadsPhase /> : <Setup />}</Box>
        <Group justify="flex-end" py="md" pb={{ base: 80, sm: "md" }}
          style={{ position: "sticky", bottom: 0, background: "var(--mantine-color-body)", borderTop: "1px solid var(--mantine-color-default-border)", zIndex: 1 }}>
          {loads ? (<>
            <Button variant="light" leftSection={<IconDeviceFloppy size={16} />} onClick={() => update(() => saveDraft(hooksB))}>Salva e continua dopo</Button>
            <Button leftSection={<IconCheck size={16} />} onClick={() => update(() => submit(hooksB))}>Assegna Scheda</Button>
          </>) : (<>
            <Button variant="default" onClick={close}>Annulla</Button>
            <Button disabled={!ok} rightSection={<IconChevronRight size={16} />} onClick={() => update(() => { if (continueToLoads()) S.ui.bPhase = "loads"; })}>Continua</Button>
          </>)}
        </Group>
    </Drawer>
  );
}

export function VariantB() {
  return <Container size="md" px={0}><Page />{S.ui.bSheet && <Sheet />}</Container>;
}

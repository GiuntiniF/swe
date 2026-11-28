// PROTOTIPO USA E GETTA. Pezzi della configurazione della scheda: elenco schede, blocchi, tabella della sessione, catalogo e form.
import { useState } from "react";
import {
  ActionIcon, Alert, Badge, Box, Button, Chip, Divider, Group, Menu, NumberInput, Paper, SegmentedControl, Select, Stack, Switch, Table, Text,
  TextInput, Textarea, ThemeIcon, Title, Tooltip, UnstyledButton,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconAlertTriangle, IconArrowsExchange, IconCalendarWeek, IconCheck, IconChevronRight, IconCopy, IconCornerDownRight, IconDots,
  IconInfoCircle, IconLock, IconPencil, IconPlus, IconSearch, IconStack2, IconTrash, IconX,
} from "@tabler/icons-react";
import {
  type Block, type Item, type Plan, type RepsDraft, CATALOG, GROUPS, MAX_SESSIONS, MAX_WEEKS, VARIANT_NAMES, type VariantKind, emptyReps, ex,
  generated, num, planSub, resizeReps, sessionExerciseIds, sessionsLabel, setsLabel, unconfigured, validate, weeksLabel,
} from "./domain";
import {
  type FlowHooks, type Update, S, addBlock, askDeleteBlock, blockIndex, cancelForm, commit, notifyOutOfScope, openPlan, plan, session,
  setWeeks, useUpdate,
} from "./store";

// ---------- Stato della scheda, come nella scelta della scheda di PT-05 ----------
export function PlanBadges({ p }: { p: Plan }) {
  return (
    <>
      {unconfigured(p) ? <Badge color="yellow" variant="light">Non configurata</Badge> : <Badge color="green" variant="light">Configurata</Badge>}
      {p.assignedTo.length > 0 && <Badge color="gray" variant="light" leftSection={<IconLock size={12} />}>Assegnata</Badge>}
    </>
  );
}

// ---------- Passo 1: elenco delle schede del PT ----------
export function PlanList() {
  const update = useUpdate();
  return (
    <Stack gap="lg">
      <div><Title order={2}>Le mie schede</Title><Text c="dimmed" size="sm">Scegli la scheda di cui configurare blocchi mensili, sessioni ed esercizi.</Text></div>
      <Paper withBorder radius="md">
        {S.plans.map((p, i) => (
          <UnstyledButton key={p.id} w="100%" px="md" py="sm" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}
            onClick={() => update(() => openPlan(p.id))}>
            <Group wrap="nowrap">
              <ThemeIcon variant="light" color={unconfigured(p) ? "yellow" : "blue"} size="lg"><IconStack2 size={18} /></ThemeIcon>
              <div style={{ flex: 1, minWidth: 0 }}><Text fw={500}>{p.name}</Text><Text size="sm" c="dimmed">{planSub(p)}</Text></div>
              <Group gap={6} visibleFrom="xs"><PlanBadges p={p} /></Group>
              <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
            </Group>
          </UnstyledButton>
        ))}
      </Paper>
    </Stack>
  );
}

export function PlanTitle({ right }: { right?: React.ReactNode }) {
  const p = plan();
  return (
    <Group justify="space-between" align="flex-start">
      <Box style={{ flex: 1, minWidth: 220 }}>
        <Group gap="xs"><Title order={2}>{p.name}</Title><PlanBadges p={p} /></Group>
        <Text size="sm" c="dimmed">{p.description} · {planSub(p)}</Text>
      </Box>
      {right}
    </Group>
  );
}

// ---------- Flusso 1a ----------
export function ReadOnlyAlert() {
  const p = plan();
  if (!p.assignedTo.length) return null;
  return (
    <Alert variant="light" color="blue" icon={<IconLock />} title="Scheda in sola lettura">
      <Text size="sm">La scheda è assegnata ad almeno un atleta: per modificarla, duplicala.</Text>
      <Button mt="sm" size="xs" variant="default" leftSection={<IconCopy size={14} />}
        onClick={() => notifyOutOfScope("Duplica Scheda", "Il flusso continua dal passo 4 di PT-16. Non fa parte di questo prototipo.")}>Duplica Scheda</Button>
    </Alert>
  );
}
/** Stesso messaggio che PT-05 mostra quando si sceglie una scheda non configurata. */
export function UnconfiguredAlert() {
  const p = plan();
  const why = unconfigured(p);
  if (!why || p.assignedTo.length || !p.blocks.length) return null;
  return (
    <Alert color="yellow" variant="light" icon={<IconAlertTriangle />} title="La scheda non è configurata">
      {why} Finché non è configurata non si può assegnare (PT-05).
    </Alert>
  );
}

// ---------- Flussi 2a, 2b, 2d: form della durata del blocco ----------
function WeeksForm({ initial, onConfirm, onCancel }: { initial: number; onConfirm: (w: number) => void; onCancel: () => void }) {
  const [v, setV] = useState<number | string>(initial);
  const [touched, setTouched] = useState(false);
  const n = typeof v === "number" ? v : NaN;
  const err = !(n >= 1 && n <= MAX_WEEKS) ? `Da 1 a ${MAX_WEEKS} settimane` : null;
  return (
    <form onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!err) onConfirm(n); }}>
      <Stack>
        <NumberInput data-autofocus label="Durata del blocco" description="In numero di settimane." suffix={v === 1 ? " settimana" : " settimane"}
          min={1} max={MAX_WEEKS} allowDecimal={false} allowNegative={false} value={v} onChange={setV} error={touched && err} w={220} />
        <Group justify="flex-end"><Button variant="default" onClick={onCancel}>Annulla</Button><Button type="submit">Conferma</Button></Group>
      </Stack>
    </form>
  );
}
export function askWeeks(update: Update, blockId?: string) {
  const id = "weeks";
  const edit = blockId ? { i: blockIndex(blockId), w: plan().blocks[blockIndex(blockId)].weeks } : null;
  modals.open({
    modalId: id,
    title: edit ? `Modifica durata del blocco ${edit.i + 1}` : `Nuovo blocco mensile (blocco ${plan().blocks.length + 1})`,
    children: (
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {edit ? "Le sessioni di allenamento del blocco non cambiano: si ripetono per la nuova durata." : "Il blocco viene aggiunto in coda alla scheda, senza sessioni di allenamento."}
        </Text>
        <WeeksForm initial={edit?.w ?? 4} onCancel={() => modals.close(id)}
          onConfirm={(w) => { modals.close(id); update(() => (blockId ? setWeeks(blockId, w) : addBlock(w))); }} />
      </Stack>
    ),
  });
}

// ---------- Passo 2: elenco dei blocchi ----------
export function BlockMenu({ b }: { b: Block }) {
  const update = useUpdate();
  if (plan().assignedTo.length) return null;
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label={`Azioni sul blocco ${blockIndex(b.id) + 1}`}><IconDots size={16} /></ActionIcon></Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconCalendarWeek size={14} />} onClick={() => askWeeks(update, b.id)}>Modifica Durata</Menu.Item>
        <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => askDeleteBlock(b.id, update)}>Elimina Blocco</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
/** Nota 3: il pattern settimanale si ripete per ogni settimana del blocco. */
export function PatternLine({ b }: { b: Block }) {
  if (!b.sessions.length) return <Text size="xs" c="dimmed">Nessuna sessione: il blocco non genera allenamenti.</Text>;
  return (
    <Tooltip multiline w={280} label="Le sessioni sono un pattern settimanale: si ripetono per ogni settimana del blocco e non sono legate a un giorno.">
      <Text size="xs" c="dimmed" style={{ cursor: "help" }}>{sessionsLabel(b.sessions.length)} × {weeksLabel(b.weeks)} = {generated(b)} allenamenti all'assegnazione</Text>
    </Tooltip>
  );
}
/** Flusso 2f: a 7 sessioni il pulsante sparisce. */
export function MaxNote({ b }: { b: Block }) {
  if (b.sessions.length < MAX_SESSIONS) return null;
  return <Text size="xs" c="dimmed"><IconInfoCircle size={12} style={{ verticalAlign: -1 }} /> Massimo raggiunto: {MAX_SESSIONS} sessioni, una per giorno della settimana.</Text>;
}
/** Flusso 2a. */
export function EmptyPlan() {
  const update = useUpdate();
  return (
    <Paper withBorder radius="md" p="xl" ta="center" style={{ borderStyle: "dashed" }}>
      <Stack align="center" gap="xs">
        <ThemeIcon size={48} radius="xl" variant="light"><IconStack2 size={26} /></ThemeIcon>
        <Title order={4}>La scheda non ha blocchi mensili</Title>
        <Text size="sm" c="dimmed" maw={420}>Aggiungi il primo blocco indicando quante settimane dura. Poi potrai aggiungere le sessioni di allenamento della settimana tipo.</Text>
        <Button mt="xs" leftSection={<IconPlus size={16} />} onClick={() => askWeeks(update)}>Aggiungi Blocco Mensile</Button>
      </Stack>
    </Paper>
  );
}

// ---------- Passo 4: tabella della sessione, con le stesse righe della tabella dei carichi di PT-05 ----------
export function SessionTable({ bId, sId, onEdit, onRemove }: { bId: string; sId: string; onEdit: (i: Item) => void; onRemove: (i: Item) => void }) {
  const s = session(bId, sId);
  const ro = !!plan().assignedTo.length;
  let letter = 0;
  const sub = (key: string, label: React.ReactNode, sets: string, rest: string) => (
    <Table.Tr key={key} bg="var(--mantine-color-default-hover)">
      <Table.Td pl="lg"><Group gap={4} c="dimmed" wrap="nowrap"><IconCornerDownRight size={14} /><Text size="sm">{label}</Text></Group></Table.Td>
      <Table.Td><Text size="sm" c="dimmed">{sets}</Text></Table.Td>
      <Table.Td><Text size="sm" c="dimmed">{rest}</Text></Table.Td>
      <Table.Td />
      {!ro && <Table.Td />}
    </Table.Tr>
  );
  const actions = (i: Item) => !ro && (
    <Table.Td>
      <Group gap={4} justify="flex-end" wrap="nowrap">
        <Tooltip label="Modifica"><ActionIcon variant="subtle" color="gray" aria-label="Modifica" onClick={(e) => { e.stopPropagation(); onEdit(i); }}><IconPencil size={16} /></ActionIcon></Tooltip>
        <Button size="compact-xs" variant="subtle" color="red" onClick={(e) => { e.stopPropagation(); onRemove(i); }}>Rimuovi</Button>
      </Group>
    </Table.Td>
  );
  return (
    <Table.ScrollContainer minWidth={620}>
      <Table verticalSpacing="xs" highlightOnHover={!ro}>
        <Table.Thead>
          <Table.Tr><Table.Th>Esercizio</Table.Th><Table.Th>Serie × rip.</Table.Th><Table.Th>Recupero</Table.Th><Table.Th>Note</Table.Th>{!ro && <Table.Th ta="right">Azioni</Table.Th>}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {s.items.flatMap((i) => {
            const v = i.variant;
            const ss = v.kind === "superset" ? String.fromCharCode(65 + letter++) : null;
            const bg = S.ui.highlight === i.id ? "var(--mantine-color-green-light)" : undefined;
            const row = (key: string, exId: string, sets: string, rest: string, notes: string | null) => (
              <Table.Tr key={key} bg={bg} style={{ cursor: ro ? undefined : "pointer" }} onClick={() => !ro && onEdit(i)}>
                <Table.Td><Group gap="xs"><Text size="sm" fw={500}>{ex(exId).name}</Text>{ss && <Badge size="xs" variant="outline" color="gray">Superset {ss}</Badge>}</Group></Table.Td>
                <Table.Td><Text size="sm">{sets}</Text></Table.Td>
                <Table.Td><Text size="sm">{rest}</Text></Table.Td>
                <Table.Td maw={240}><Text size="xs" c="dimmed" fs={notes ? "italic" : undefined}>{notes || "—"}</Text></Table.Td>
                {actions(i)}
              </Table.Tr>
            );
            // Nel superset il recupero è sull'ultimo esercizio, come in PT-05.
            const rows = [row(i.id, i.exerciseTypeId, setsLabel(i.reps), ss ? "—" : `${i.rest} s`, i.notes)];
            if (v.kind === "superset")
              v.partners.forEach((p, k) => rows.push(row(`${i.id}-p${k}`, p.exerciseTypeId, setsLabel(i.reps.map(() => p.reps)), k === v.partners.length - 1 ? `${i.rest} s` : "—", null)));
            if (v.kind === "dropset") v.drops.forEach((d, k) => rows.push(sub(`${i.id}-d${k}`, <>Drop-set × {num(d)}</>, "1 × max", "—")));
            if (v.kind === "restpause") rows.push(sub(`${i.id}-rp`, "Rest-pause", "miniserie al cedimento", `${v.pause} s tra le miniserie`));
            return rows;
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
export function NoExercises({ onAdd }: { onAdd?: () => void }) {
  return (
    <Stack align="center" gap={6} py="lg">
      <Text size="sm" c="dimmed">La sessione non ha ancora esercizi.</Text>
      {onAdd && <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={onAdd}>Aggiungi Esercizio</Button>}
    </Stack>
  );
}

// ---------- Passo 6: catalogo (Nota 4: predefinito, in sola lettura) ----------
export function ExerciseCatalog({ onPick }: { onPick: (id: string) => void }) {
  const update = useUpdate();
  const q = S.ui.query.trim().toLowerCase();
  const list = CATALOG.filter((e) => (!S.ui.group || e.group === S.ui.group) && (!q || `${e.name} ${e.muscles}`.toLowerCase().includes(q)));
  const inSession = new Set(S.sel ? sessionExerciseIds(session(S.sel.blockId, S.sel.sessionId)) : []);
  const current = S.draft?.exerciseTypeId;
  return (
    <Stack gap="sm">
      <TextInput data-autofocus placeholder="Cerca per nome o muscolo" leftSection={<IconSearch size={16} />} value={S.ui.query}
        onChange={(e) => { const v = e.currentTarget.value; update(() => { S.ui.query = v; }); }}
        rightSection={S.ui.query ? <ActionIcon size="sm" variant="subtle" color="gray" aria-label="Pulisci" onClick={() => update(() => { S.ui.query = ""; })}><IconX size={14} /></ActionIcon> : null} />
      <Chip.Group value={S.ui.group ?? "all"} onChange={(v) => update(() => { S.ui.group = v === "all" ? null : (v as string); })}>
        <Group gap={6}>
          <Chip size="xs" value="all">Tutti</Chip>
          {GROUPS.map((g) => <Chip key={g} size="xs" value={g}>{g}</Chip>)}
        </Group>
      </Chip.Group>
      <Paper withBorder radius="md">
        {list.map((e, k) => (
          <UnstyledButton key={e.id} w="100%" px="md" py="sm" onClick={() => onPick(e.id)} style={{ borderTop: k ? "1px solid var(--mantine-color-default-border)" : undefined }}
            bg={current === e.id ? "var(--mantine-primary-color-light)" : undefined}>
            <Group wrap="nowrap">
              <div style={{ flex: 1, minWidth: 0 }}><Text fw={500}>{e.name}</Text><Text size="sm" c="dimmed" truncate>{e.muscles}</Text></div>
              {inSession.has(e.id) && <Badge variant="outline" color="gray" visibleFrom="xs">Già nella sessione</Badge>}
              <Badge variant="light" color="gray">{e.group}</Badge>
              <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
            </Group>
          </UnstyledButton>
        ))}
        {!list.length && <Text size="sm" c="dimmed" ta="center" py="lg">Nessun esercizio trovato.</Text>}
      </Paper>
      <Text size="xs" c="dimmed">Il catalogo degli esercizi è predefinito: puoi sceglierli, ma non aggiungerli o modificarli.</Text>
    </Stack>
  );
}

// ---------- Passi 8-10, flusso 5a, variazione 9a: form dei dettagli ----------
const catalogData = GROUPS.map((g) => ({ group: g, items: CATALOG.filter((e) => e.group === g).map((e) => ({ value: e.id, label: e.name })) }));

function RepsField({ r, error, label }: { r: RepsDraft; error?: string; label?: string }) {
  const update = useUpdate();
  const toNum = (v: number | string) => (v === "" ? "" : Number(v));
  return (
    <Stack gap={4}>
      <Group gap="xs" align="flex-start" wrap="wrap">
        {label && <Text size="sm" w={64} pt={6}>{label}</Text>}
        <SegmentedControl size="xs" value={r.type} onChange={(v) => update(() => { r.type = v as RepsDraft["type"]; })}
          data={[{ value: "fixed", label: "Fisse" }, { value: "range", label: "Intervallo" }, { value: "failure", label: "Cedimento" }]} />
        {r.type === "fixed" && <NumberInput size="xs" w={110} aria-label="Ripetizioni" min={1} allowDecimal={false} allowNegative={false} suffix=" rip." value={r.n} onChange={(v) => update(() => { r.n = toNum(v); })} error={!!error} />}
        {r.type === "range" && (
          <Group gap={4} wrap="nowrap">
            <NumberInput size="xs" w={70} aria-label="Minimo" min={1} allowDecimal={false} allowNegative={false} value={r.min} onChange={(v) => update(() => { r.min = toNum(v); })} error={!!error} />
            <Text size="sm">–</Text>
            <NumberInput size="xs" w={70} aria-label="Massimo" min={1} allowDecimal={false} allowNegative={false} value={r.max} onChange={(v) => update(() => { r.max = toNum(v); })} error={!!error} />
            <Text size="sm" c="dimmed">rip.</Text>
          </Group>
        )}
        {r.type === "failure" && <Text size="sm" c="dimmed" pt={4}>fino al cedimento muscolare</Text>}
      </Group>
      {error && <Text size="xs" c="red" pl={label ? 72 : 0}>{error}</Text>}
    </Stack>
  );
}

export function ExerciseForm({ h, onChange }: { h: FlowHooks; onChange?: () => void }) {
  const update = useUpdate();
  const d = S.draft!;
  const e = ex(d.exerciseTypeId);
  const narrow = useMediaQuery("(max-width: 30em)");
  const err = d.showErrors ? validate(d) : {};
  const set = (fn: () => void) => update(fn);
  const toNum = (v: number | string) => (v === "" ? "" : Number(v));
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); update(() => commit(h)); }}>
      <Stack gap="md">
        <Group wrap="nowrap">
          <ThemeIcon variant="light" size="lg"><IconStack2 size={18} /></ThemeIcon>
          <Box style={{ flex: 1, minWidth: 0 }}><Text size="sm" c="dimmed">Esercizio</Text><Text fw={600}>{e.name}</Text><Text size="sm" c="dimmed">{e.group} · {e.muscles}</Text></Box>
          {onChange && <Button size="xs" variant="default" leftSection={<IconArrowsExchange size={14} />} onClick={onChange}>Cambia</Button>}
        </Group>
        <Divider />

        <Group align="flex-start" gap="lg">
          <NumberInput label="Serie" description="Da 1 a 12" w={110} min={1} max={12} allowDecimal={false} allowNegative={false} value={d.sets} error={err.sets}
            onChange={(v) => set(() => { d.sets = toNum(v); resizeReps(d); })} />
          <NumberInput label="Recupero tra le serie" description={d.kind === "superset" ? "Dopo l'intero superset" : "In secondi"} w={200} min={0} step={15}
            allowDecimal={false} allowNegative={false} suffix=" s" value={d.rest} error={err.rest} onChange={(v) => set(() => { d.rest = toNum(v); })} />
        </Group>

        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Ripetizioni</Text>
            <Switch size="xs" label="Uguali per ogni serie" checked={d.same} onChange={(ev) => { const c = ev.currentTarget.checked; set(() => { d.same = c; if (!c) d.reps = d.reps.map(() => ({ ...d.reps[0] })); }); }} />
          </Group>
          {d.same ? <RepsField r={d.reps[0]} error={err.reps0} /> : d.reps.map((r, k) => <RepsField key={k} r={r} label={`Serie ${k + 1}`} error={err[`reps${k}`]} />)}
        </Stack>

        <Divider />
        <Stack gap="xs">
          <Text size="sm" fw={500}>Variante di esecuzione</Text>
          <SegmentedControl fullWidth orientation={narrow ? "vertical" : "horizontal"} value={d.kind} onChange={(v) => set(() => { d.kind = v as VariantKind; })}
            data={(Object.keys(VARIANT_NAMES) as VariantKind[]).map((k) => ({ value: k, label: VARIANT_NAMES[k] }))} />
          {d.kind === "superset" && (
            <Paper withBorder radius="md" p="sm">
              <Stack gap="sm">
                <Text size="xs" c="dimmed">Gli esercizi si eseguono uno dopo l'altro, senza recupero, con lo stesso numero di serie ({d.sets || "—"}). Il recupero vale per tutto il superset.</Text>
                {d.partners.map((p, k) => (
                  <Stack key={k} gap={6} pb="xs" style={{ borderBottom: "1px dashed var(--mantine-color-default-border)" }}>
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      <Select style={{ flex: 1 }} size="xs" searchable placeholder="Scegli dal catalogo" data={catalogData} value={p.exerciseTypeId} error={err[`partner${k}`]}
                        label={`Esercizio ${k + 2} del superset`} onChange={(v) => set(() => { p.exerciseTypeId = v; })} nothingFoundMessage="Nessun esercizio" />
                      {d.partners.length > 1 && <ActionIcon mt={22} variant="subtle" color="red" aria-label="Togli dal superset" onClick={() => set(() => { d.partners.splice(k, 1); })}><IconTrash size={14} /></ActionIcon>}
                    </Group>
                    <RepsField r={p.reps} error={err[`partnerReps${k}`]} />
                  </Stack>
                ))}
                <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} style={{ alignSelf: "flex-start" }} onClick={() => set(() => { d.partners.push({ exerciseTypeId: null, reps: emptyReps() }); })}>Aggiungi un altro esercizio</Button>
              </Stack>
            </Paper>
          )}
          {d.kind === "dropset" && (
            <Paper withBorder radius="md" p="sm">
              <Stack gap="xs">
                <Text size="xs" c="dimmed">Dopo l'ultima serie si scala il carico e si continua fino al cedimento. Ogni discesa moltiplica il carico della discesa precedente. Il carico vero si inserisce all'assegnazione (PT-05).</Text>
                {d.drops.map((x, k) => (
                  <Group key={k} gap="xs" align="flex-start" wrap="nowrap">
                    <Text size="sm" w={80} pt={6}>Discesa {k + 1}</Text>
                    <NumberInput size="xs" w={110} prefix="× " decimalScale={2} decimalSeparator="," step={0.05} min={0.05} max={0.95} allowNegative={false} value={x}
                      onChange={(v) => set(() => { d.drops[k] = toNum(v); })} error={err[`drop${k}`]} aria-label={`Moltiplicatore della discesa ${k + 1}`} />
                    {d.drops.length > 1 && <ActionIcon mt={4} variant="subtle" color="red" aria-label="Togli la discesa" onClick={() => set(() => { d.drops.splice(k, 1); })}><IconTrash size={14} /></ActionIcon>}
                  </Group>
                ))}
                {d.drops.length < 3 && <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} style={{ alignSelf: "flex-start" }} onClick={() => set(() => { d.drops.push(0.8); })}>Aggiungi una discesa</Button>}
              </Stack>
            </Paper>
          )}
          {d.kind === "restpause" && (
            <Paper withBorder radius="md" p="sm">
              <Group align="flex-start">
                <NumberInput size="xs" w={200} label="Pausa tra le miniserie" suffix=" s" min={1} allowDecimal={false} allowNegative={false} value={d.pause} error={err.pause}
                  onChange={(v) => set(() => { d.pause = toNum(v); })} />
                <Text size="xs" c="dimmed" style={{ flex: 1, minWidth: 180 }} pt={22}>Dopo il cedimento si riposa per pochi secondi e si continua con lo stesso carico.</Text>
              </Group>
            </Paper>
          )}
        </Stack>

        <Textarea label="Note esecutive" placeholder="Per esempio: discesa controllata in 3 secondi, fermo di 1 secondo al petto." autosize minRows={2} maxRows={5}
          value={d.notes} onChange={(ev) => { const v = ev.currentTarget.value; set(() => { d.notes = v; }); }} />

        <Alert variant="light" color="gray" icon={<IconInfoCircle />} p="xs">
          <Text size="xs">Il carico non si inserisce qui: è specifico dell'atleta e si inserisce al momento dell'assegnazione (PT-05).</Text>
        </Alert>

        <Group justify="space-between" mt="sm">
          <Button variant="default" onClick={() => update(() => cancelForm(h))}>Annulla</Button>
          <Button type="submit" leftSection={d.editingId ? <IconCheck size={16} /> : <IconPlus size={16} />}>{d.editingId ? "Salva Modifiche" : "Aggiungi Esercizio"}</Button>
        </Group>
      </Stack>
    </form>
  );
}

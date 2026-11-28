// PROTOTIPO USA E GETTA. Variante A: pagine in sequenza, una per passo del caso d'uso (come i mockup Salt di PT-05).
import { Anchor, Badge, Box, Breadcrumbs, Button, Container, Group, Paper, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconPlus, IconTrash } from "@tabler/icons-react";
import { MAX_SESSIONS, sessionLabel, sessionSub, weeksLabel } from "./domain";
import {
  BlockMenu, EmptyPlan, ExerciseCatalog, ExerciseForm, ItemTable, MaxNote, NoExercises, PatternLine, PlanTitle, ReadOnlyAlert, askWeeks,
} from "./shared";
import {
  type VariantHooks, S, addSession, askDeleteSession, askRemove, closePlan, editable, pick, plan, select, selected, startAdd, startEdit,
  useUpdate, where,
} from "./store";

export const hooksA: VariantHooks = {
  plan() { S.ui.aView = "plan"; },
  session() { S.ui.aView = "session"; },
  catalog() { S.ui.aView = "catalog"; },
  form() { S.ui.aView = "form"; },
};

function Crumbs() {
  const update = useUpdate();
  const v = S.ui.aView;
  const sel = selected();
  const items: React.ReactNode[] = [
    <Anchor key="s" size="sm" component="button" onClick={() => update(closePlan)}>Schede</Anchor>,
    v === "plan" ? <Text key="p" size="sm">{plan().name}</Text> : <Anchor key="p" size="sm" component="button" onClick={() => update(() => { S.draft = null; hooksA.plan(); })}>{plan().name}</Anchor>,
  ];
  if (sel && v !== "plan") items.push(v === "session" ? <Text key="x" size="sm">{where(sel.b.id, sel.s.id)}</Text> : <Anchor key="x" size="sm" component="button" onClick={() => update(() => { S.draft = null; hooksA.session(); })}>{where(sel.b.id, sel.s.id)}</Anchor>);
  if (v === "catalog") items.push(<Text key="c" size="sm">Aggiungi Esercizio</Text>);
  if (v === "form") items.push(<Text key="f" size="sm">{S.draft?.editingId ? "Modifica esercizio" : "Aggiungi Esercizio"}</Text>);
  return <Breadcrumbs separatorMargin={6}>{items}</Breadcrumbs>;
}

function PlanPage() {
  const update = useUpdate();
  const p = plan();
  const ed = editable();
  return (
    <Stack gap="lg">
      <PlanTitle right={ed && p.blocks.length > 0 && <Button leftSection={<IconPlus size={16} />} onClick={() => askWeeks(update)}>Aggiungi Blocco Mensile</Button>} />
      <ReadOnlyAlert />
      {!p.blocks.length && (ed ? <EmptyPlan /> : null)}
      {p.blocks.map((b, bi) => (
        <Paper key={b.id} withBorder radius="md" bg={S.ui.highlight === b.id ? "var(--mantine-color-green-light)" : undefined}>
          <Group justify="space-between" px="md" py="sm" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
            <Box>
              <Group gap="xs"><Title order={4}>Blocco {bi + 1}</Title><Badge variant="default">{weeksLabel(b.weeks)}</Badge><Badge variant="light" color="gray">{b.sessions.length} / {MAX_SESSIONS} sessioni</Badge></Group>
              <PatternLine b={b} />
            </Box>
            <BlockMenu b={b} />
          </Group>
          {b.sessions.map((s, si) => (
            <UnstyledButton key={s.id} w="100%" px="md" py="sm" style={{ borderTop: si ? "1px solid var(--mantine-color-default-border)" : undefined }}
              onClick={() => update(() => select(hooksA, b.id, s.id))}>
              <Group wrap="nowrap">
                <Box style={{ flex: 1, minWidth: 0 }}><Text fw={500}>{sessionLabel(si)}</Text><Text size="sm" c="dimmed" truncate>{sessionSub(s)}</Text></Box>
                {!s.items.length && <Badge variant="light" color="yellow">Vuota</Badge>}
                <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
              </Group>
            </UnstyledButton>
          ))}
          {!b.sessions.length && <Text size="sm" c="dimmed" px="md" py="sm">Il blocco non ha ancora sessioni di allenamento.</Text>}
          {ed && (
            <Box px="md" py="sm" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
              {b.sessions.length < MAX_SESSIONS
                ? <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => update(() => addSession(hooksA, b.id))}>Aggiungi Sessione</Button>
                : <MaxNote b={b} />}
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

function SessionPage() {
  const update = useUpdate();
  const { b, s } = selected()!;
  const ed = editable();
  const bi = plan().blocks.indexOf(b);
  const si = b.sessions.indexOf(s);
  // Flusso 5b: si passa a un'altra sessione dello stesso blocco senza tornare all'elenco.
  const goto = (k: number) => update(() => select(hooksA, b.id, b.sessions[k].id));
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Group gap="xs"><Title order={2}>{sessionLabel(si)}</Title><Badge variant="default">Blocco {bi + 1} · {weeksLabel(b.weeks)}</Badge></Group>
          <Text size="sm" c="dimmed">{sessionSub(s)} · si ripete per {weeksLabel(b.weeks)}</Text>
        </Box>
        {ed && (
          <Group gap="xs">
            <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => askDeleteSession(hooksA, b.id, s.id, update)}>Elimina Sessione</Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => update(() => startAdd(hooksA))}>Aggiungi Esercizio</Button>
          </Group>
        )}
      </Group>
      <ReadOnlyAlert />
      <Paper withBorder radius="md" p="md">
        {s.items.length
          ? <ItemTable bId={b.id} sId={s.id} onEdit={(i) => update(() => startEdit(hooksA, b.id, s.id, i))} onRemove={(i) => askRemove(b.id, s.id, i, update)} />
          : <NoExercises onAdd={ed ? () => update(() => startAdd(hooksA)) : undefined} />}
      </Paper>
      <Group justify="space-between">
        <Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => update(() => hooksA.plan())}>Tutti i blocchi</Button>
        <Group gap="xs">
          <Button variant="subtle" disabled={si === 0} leftSection={<IconChevronLeft size={14} />} onClick={() => goto(si - 1)}>{si > 0 ? sessionLabel(si - 1) : "Precedente"}</Button>
          <Button variant="subtle" disabled={si === b.sessions.length - 1} rightSection={<IconChevronRight size={14} />} onClick={() => goto(si + 1)}>{si < b.sessions.length - 1 ? sessionLabel(si + 1) : "Successiva"}</Button>
        </Group>
      </Group>
    </Stack>
  );
}

function CatalogPage() {
  const update = useUpdate();
  const changing = !!S.draft;
  return (
    <Stack gap="lg" maw={720}>
      <div><Title order={2}>{changing ? "Cambia esercizio" : "Scegli un esercizio"}</Title><Text size="sm" c="dimmed">Passo 1 di 2 · dal catalogo</Text></div>
      <ExerciseCatalog onPick={(id) => update(() => pick(hooksA, id))} />
      <Group><Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => update(() => (changing ? hooksA.form() : hooksA.session()))}>Indietro</Button></Group>
    </Stack>
  );
}

function FormPage() {
  const update = useUpdate();
  const d = S.draft!;
  return (
    <Stack gap="lg" maw={720}>
      <div><Title order={2}>{d.editingId ? "Modifica esercizio" : "Dettagli dell'esercizio"}</Title><Text size="sm" c="dimmed">{d.editingId ? where(d.blockId, d.sessionId) : "Passo 2 di 2 · come si esegue"}</Text></div>
      <Paper withBorder radius="md" p="lg"><ExerciseForm h={hooksA} onChange={() => update(() => hooksA.catalog())} /></Paper>
    </Stack>
  );
}

export function VariantA() {
  const v = S.ui.aView;
  const View = !selected() ? PlanPage : { plan: PlanPage, session: SessionPage, catalog: CatalogPage, form: S.draft ? FormPage : SessionPage }[v];
  return (
    <Container size="lg" px={0}>
      <Stack gap="lg"><Crumbs /><View /></Stack>
    </Container>
  );
}

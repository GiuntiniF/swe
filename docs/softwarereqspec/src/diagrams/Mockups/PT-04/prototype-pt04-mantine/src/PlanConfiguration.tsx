// PROTOTIPO USA E GETTA. PT-04 a pagine, nello stile del wizard di PT-05: una pagina per passo, Breadcrumbs e, per
// l'aggiunta di un esercizio, uno Stepper a due passi (catalogo, poi dettagli).
import { Anchor, Badge, Box, Breadcrumbs, Button, Container, Group, Paper, Stack, Stepper, Text, Title, UnstyledButton } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconPlus, IconTrash } from "@tabler/icons-react";
import { MAX_SESSIONS, sessionLabel, sessionSub, weeksLabel } from "./domain";
import {
  BlockMenu, EmptyPlan, ExerciseCatalog, ExerciseForm, MaxNote, NoExercises, PatternLine, PlanList, PlanTitle, ReadOnlyAlert, SessionTable,
  UnconfiguredAlert, askWeeks,
} from "./shared";
import {
  type FlowHooks, S, addSession, askDeleteSession, askRemove, closePlan, editable, pick, plan, select, selected, startAdd, startEdit,
  useUpdate, where,
} from "./store";

export const hooks: FlowHooks = {
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
    v === "plan" || !sel ? <Text key="p" size="sm">{plan().name}</Text> : <Anchor key="p" size="sm" component="button" onClick={() => update(() => { S.draft = null; hooks.plan(); })}>{plan().name}</Anchor>,
  ];
  if (sel && v !== "plan") items.push(v === "session" ? <Text key="x" size="sm">{where(sel.b.id, sel.s.id)}</Text> : <Anchor key="x" size="sm" component="button" onClick={() => update(() => { S.draft = null; hooks.session(); })}>{where(sel.b.id, sel.s.id)}</Anchor>);
  if (v === "catalog" || v === "form") items.push(<Text key="f" size="sm">{S.draft?.editingId ? "Modifica esercizio" : "Aggiungi Esercizio"}</Text>);
  return <Breadcrumbs>{items}</Breadcrumbs>;
}

/** Testata delle pagine del catalogo e del form, come WizardHead di PT-05. */
function AddHead({ step }: { step: number }) {
  const d = S.draft;
  const sel = selected()!;
  const editing = !!d?.editingId;
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{editing ? "Modifica esercizio" : "Aggiungi Esercizio"}</Title>
        <Text size="sm" c="dimmed">{where(sel.b.id, sel.s.id)} · {plan().name}</Text>
      </div>
      {!editing && (
        <Stepper active={step} size="sm" maw={560}>
          <Stepper.Step label="Esercizio" description="Scegli dal catalogo" />
          <Stepper.Step label="Dettagli" description="Serie, recupero, variante" />
        </Stepper>
      )}
    </Stack>
  );
}

function PlanPage() {
  const update = useUpdate();
  const p = plan();
  const ed = editable();
  return (
    <Stack gap="lg">
      <PlanTitle right={ed && p.blocks.length > 0 && <Button leftSection={<IconPlus size={16} />} onClick={() => askWeeks(update)}>Aggiungi Blocco Mensile</Button>} />
      <ReadOnlyAlert />
      <UnconfiguredAlert />
      {!p.blocks.length && ed && <EmptyPlan />}
      {p.blocks.map((b, bi) => (
        <Paper key={b.id} withBorder radius="md" bg={S.ui.highlight === b.id ? "var(--mantine-color-green-light)" : undefined}>
          <Group justify="space-between" px="md" py="sm" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
            <Box>
              <Group gap="xs"><Text fw={600}>Blocco {bi + 1}</Text><Badge variant="default">{weeksLabel(b.weeks)}</Badge><Badge variant="light" color="gray">{b.sessions.length} / {MAX_SESSIONS} sessioni</Badge></Group>
              <PatternLine b={b} />
            </Box>
            <BlockMenu b={b} />
          </Group>
          {b.sessions.map((s, si) => (
            <UnstyledButton key={s.id} w="100%" px="md" py="sm" style={{ borderTop: si ? "1px solid var(--mantine-color-default-border)" : undefined }}
              onClick={() => update(() => select(hooks, b.id, s.id))}>
              <Group wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}><Text fw={500}>{sessionLabel(si)}</Text><Text size="sm" c="dimmed" truncate>{sessionSub(s)}</Text></div>
                {!s.items.length && <Badge variant="light" color="yellow">Vuota</Badge>}
                <IconChevronRight size={16} color="var(--mantine-color-dimmed)" />
              </Group>
            </UnstyledButton>
          ))}
          {!b.sessions.length && <Text size="sm" c="dimmed" px="md" py="sm">Il blocco non ha ancora sessioni di allenamento.</Text>}
          {ed && (
            <Box px="md" py="sm" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
              {b.sessions.length < MAX_SESSIONS
                ? <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => update(() => addSession(hooks, b.id))}>Aggiungi Sessione</Button>
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
  const goto = (k: number) => update(() => select(hooks, b.id, b.sessions[k].id));
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Group gap="xs"><Title order={2}>{sessionLabel(si)}</Title><Badge variant="default">Blocco {bi + 1} · {weeksLabel(b.weeks)}</Badge></Group>
          <Text size="sm" c="dimmed">{sessionSub(s)} · si ripete per {weeksLabel(b.weeks)}</Text>
        </Box>
        {ed && (
          <Group gap="xs">
            <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={() => askDeleteSession(hooks, b.id, s.id, update)}>Elimina Sessione</Button>
            <Button leftSection={<IconPlus size={16} />} onClick={() => update(() => startAdd(hooks))}>Aggiungi Esercizio</Button>
          </Group>
        )}
      </Group>
      <ReadOnlyAlert />
      <Paper withBorder radius="md" p="md">
        {s.items.length
          ? <SessionTable bId={b.id} sId={s.id} onEdit={(i) => update(() => startEdit(hooks, b.id, s.id, i))} onRemove={(i) => askRemove(b.id, s.id, i, update)} />
          : <NoExercises onAdd={ed ? () => update(() => startAdd(hooks)) : undefined} />}
      </Paper>
      <Group justify="space-between">
        <Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => update(() => hooks.plan())}>Tutti i blocchi</Button>
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
    <Stack gap="lg">
      <AddHead step={0} />
      <Box maw={720}><ExerciseCatalog onPick={(id) => update(() => pick(hooks, id))} /></Box>
      <Group><Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => update(() => (changing ? hooks.form() : hooks.session()))}>Indietro</Button></Group>
    </Stack>
  );
}

function FormPage() {
  const update = useUpdate();
  return (
    <Stack gap="lg">
      <AddHead step={1} />
      <Paper withBorder radius="md" p="lg" maw={720}><ExerciseForm h={hooks} onChange={() => update(() => hooks.catalog())} /></Paper>
    </Stack>
  );
}

export function PlanConfiguration() {
  if (!S.planId) return <Container size="lg" px={0}><PlanList /></Container>;
  const v = S.ui.aView;
  const View = !selected() ? PlanPage : { plan: PlanPage, session: SessionPage, catalog: CatalogPage, form: S.draft ? FormPage : SessionPage }[v];
  return (
    <Container size="lg" px={0}>
      <Stack gap="lg"><Crumbs /><View /></Stack>
    </Container>
  );
}

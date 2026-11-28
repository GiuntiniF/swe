// PROTOTIPO USA E GETTA. Variante C: board della settimana tipo. Ogni blocco è una riga con fino a 7 colonne (le sessioni),
// gli esercizi sono già visibili nelle colonne; catalogo e form si aprono in un modale.
import { useEffect } from "react";
import {
  ActionIcon, Anchor, Badge, Box, Breadcrumbs, Button, Group, Menu, Modal, Paper, ScrollArea, Stack, Text, Title, UnstyledButton,
} from "@mantine/core";
import { IconChevronLeft, IconDots, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { type Block, type Session, MAX_SESSIONS, ex, sessionLabel, sessionSub, setsLabel, weeksLabel } from "./domain";
import {
  BlockMenu, EmptyPlan, ExerciseCatalog, ExerciseForm, MaxNote, PatternLine, PlanTitle, ReadOnlyAlert, VariantBadge, VariantLines, askWeeks,
  restLabel,
} from "./shared";
import {
  type VariantHooks, S, addSession, askDeleteSession, askRemove, closePlan, editable, pick, plan, select, startAdd, startEdit, useUpdate,
  where,
} from "./store";

export const hooksC: VariantHooks = {
  plan() { S.ui.cModal = null; },
  session() { S.ui.cModal = null; },
  catalog() { S.ui.cModal = "catalog"; },
  form() { S.ui.cModal = "form"; },
};

const COL = 250;

function SessionColumn({ b, s, si }: { b: Block; s: Session; si: number }) {
  const update = useUpdate();
  const ed = editable();
  const active = S.sel?.sessionId === s.id;
  const fresh = S.ui.highlight === s.id;
  return (
    <Paper id={`col-${s.id}`} withBorder radius="md" w={COL} style={{ flexShrink: 0, display: "flex", flexDirection: "column", outline: active ? "2px solid var(--mantine-primary-color-filled)" : undefined }}
      bg={fresh ? "var(--mantine-color-green-light)" : undefined}>
      <Group justify="space-between" wrap="nowrap" px="sm" py={8} style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Box style={{ minWidth: 0 }}><Text fw={600} size="sm">{sessionLabel(si)}</Text><Text size="xs" c="dimmed" truncate>{sessionSub(s)}</Text></Box>
        {ed && (
          <Menu position="bottom-end" withinPortal>
            <Menu.Target><ActionIcon variant="subtle" color="gray" size="sm" aria-label={`Azioni su ${sessionLabel(si)}`}><IconDots size={14} /></ActionIcon></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPlus size={14} />} onClick={() => update(() => { select(hooksC, b.id, s.id); startAdd(hooksC); })}>Aggiungi Esercizio</Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => askDeleteSession(hooksC, b.id, s.id, update)}>Elimina Sessione</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
      <Stack gap={6} p={6} style={{ flex: 1 }}>
        {s.items.map((i) => (
          <Paper key={i.id} withBorder radius="sm" p={8} bg={S.ui.highlight === i.id ? "var(--mantine-color-green-light)" : "var(--mantine-color-body)"}
            style={{ cursor: ed ? "pointer" : undefined }} onClick={() => ed && update(() => startEdit(hooksC, b.id, s.id, i))}>
            <Group gap={4} wrap="nowrap" align="flex-start">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={4}><Text size="sm" fw={500} lh={1.3}>{ex(i.exerciseTypeId).name}</Text><VariantBadge i={i} /></Group>
                <Text size="xs" c="dimmed">{setsLabel(i.reps)} · {restLabel(i)}</Text>
                <VariantLines i={i} size="xs" />
                {i.notes && <Text size="xs" c="dimmed" fs="italic" lineClamp={2} mt={2}>{i.notes}</Text>}
              </Box>
              {ed && <ActionIcon size="xs" variant="subtle" color="gray" aria-label="Rimuovi" onClick={(e) => { e.stopPropagation(); askRemove(b.id, s.id, i, update); }}><IconX size={12} /></ActionIcon>}
            </Group>
          </Paper>
        ))}
        {!s.items.length && <Text size="xs" c="dimmed" ta="center" py="md">Nessun esercizio</Text>}
        {ed && (
          <Button size="xs" variant="subtle" leftSection={<IconPlus size={14} />} mt="auto" onClick={() => update(() => { select(hooksC, b.id, s.id); startAdd(hooksC); })}>Aggiungi Esercizio</Button>
        )}
      </Stack>
    </Paper>
  );
}

function BlockRow({ b, bi }: { b: Block; bi: number }) {
  const update = useUpdate();
  const ed = editable();
  const free = MAX_SESSIONS - b.sessions.length;
  return (
    <Paper withBorder radius="md" p="md" bg={S.ui.highlight === b.id ? "var(--mantine-color-green-light)" : undefined}>
      <Group justify="space-between" align="flex-start" mb="sm">
        <Box>
          <Group gap="xs"><Title order={4}>Blocco {bi + 1}</Title><Badge variant="default">{weeksLabel(b.weeks)}</Badge></Group>
          <PatternLine b={b} />
        </Box>
        <Group gap="xs">
          <Text size="xs" c="dimmed">{b.sessions.length} di {MAX_SESSIONS} sessioni</Text>
          <BlockMenu b={b} />
        </Group>
      </Group>
      <ScrollArea type="auto" offsetScrollbars>
        <Group gap="sm" wrap="nowrap" align="stretch" pb={4}>
          {b.sessions.map((s, si) => <SessionColumn key={s.id} b={b} s={s} si={si} />)}
          {/* Flusso 2c: la colonna vuota è il pulsante "Aggiungi Sessione"; a 7 sessioni sparisce (flusso 2f). */}
          {ed && free > 0 && (
            <UnstyledButton w={COL} mih={140} style={{ flexShrink: 0, border: "2px dashed var(--mantine-color-default-border)", borderRadius: 8 }}
              onClick={() => update(() => addSession(hooksC, b.id))}>
              <Stack align="center" gap={4} c="dimmed">
                <IconPlus size={20} />
                <Text size="sm" fw={500}>Aggiungi Sessione</Text>
                <Text size="xs">{free === 1 ? "ancora 1 disponibile" : `ancora ${free} disponibili`}</Text>
              </Stack>
            </UnstyledButton>
          )}
          {!ed && !b.sessions.length && <Text size="sm" c="dimmed">Il blocco non ha sessioni di allenamento.</Text>}
        </Group>
      </ScrollArea>
      {ed && <MaxNote b={b} />}
    </Paper>
  );
}

function ExerciseModal() {
  const update = useUpdate();
  const open = S.ui.cModal;
  const d = S.draft;
  const close = () => update(() => { S.draft = null; S.ui.cModal = null; });
  const title = open === "catalog"
    ? <Group gap={6}>{d && <ActionIcon variant="subtle" color="gray" aria-label="Torna al form" onClick={() => update(() => hooksC.form())}><IconChevronLeft size={16} /></ActionIcon>}<Text fw={600}>{d ? "Cambia esercizio" : "Aggiungi Esercizio"}</Text></Group>
    : <Text fw={600}>{d?.editingId ? "Modifica esercizio" : "Dettagli dell'esercizio"}</Text>;
  return (
    <Modal opened={!!open && !!S.sel} onClose={close} size="lg" title={title}>
      {S.sel && <Text size="xs" c="dimmed" mb="md">{where(S.sel.blockId, S.sel.sessionId)}</Text>}
      {open === "catalog" && <ExerciseCatalog maxHeight="50vh" onPick={(id) => update(() => pick(hooksC, id))} />}
      {open === "form" && d && <ExerciseForm h={hooksC} onChange={() => update(() => hooksC.catalog())} />}
    </Modal>
  );
}

export function VariantC() {
  const update = useUpdate();
  const p = plan();
  const ed = editable();
  // Dopo "Aggiungi Sessione" la nuova colonna può essere fuori vista: la porta nel riquadro.
  const hl = S.ui.highlight;
  useEffect(() => { if (hl) document.getElementById(`col-${hl}`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); }, [hl]);
  return (
    <Stack gap="lg">
      <Breadcrumbs><Anchor size="sm" component="button" onClick={() => update(closePlan)}>Schede</Anchor><Text size="sm">{p.name}</Text></Breadcrumbs>
      <PlanTitle right={ed && p.blocks.length > 0 && <Button leftSection={<IconPlus size={16} />} onClick={() => askWeeks(update)}>Aggiungi Blocco Mensile</Button>} />
      <ReadOnlyAlert />
      {!p.blocks.length && ed && <EmptyPlan />}
      {p.blocks.map((b, bi) => <BlockRow key={b.id} b={b} bi={bi} />)}
      <ExerciseModal />
    </Stack>
  );
}

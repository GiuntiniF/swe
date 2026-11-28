// PROTOTIPO USA E GETTA. Variante B: albero dei blocchi a sinistra, sessione a destra, catalogo e form in un pannello laterale.
import {
  ActionIcon, Anchor, Badge, Box, Breadcrumbs, Button, Drawer, Grid, Group, Menu, NavLink, Paper, Stack, Text, ThemeIcon, Title, Tooltip,
} from "@mantine/core";
import { IconCalendarWeek, IconChevronLeft, IconDots, IconListDetails, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { type Item, MAX_SESSIONS, ex, sessionLabel, sessionSub, setsLabel, weeksLabel } from "./domain";
import {
  BlockMenu, EmptyPlan, ExerciseCatalog, ExerciseForm, MaxNote, NoExercises, PatternLine, PlanTitle, ReadOnlyAlert, VariantBadge, VariantLines,
  askWeeks, restLabel,
} from "./shared";
import {
  type VariantHooks, S, addSession, askDeleteSession, askRemove, closePlan, editable, pick, plan, select, selected, startAdd, startEdit,
  useUpdate, where,
} from "./store";

export const hooksB: VariantHooks = {
  plan() { S.ui.bDrawer = null; },
  session() { S.ui.bDrawer = null; },
  catalog() { S.ui.bDrawer = "catalog"; },
  form() { S.ui.bDrawer = "form"; },
};

function Tree() {
  const update = useUpdate();
  const p = plan();
  const ed = editable();
  return (
    <Paper withBorder radius="md" p="xs">
      <Stack gap={4}>
        {p.blocks.map((b, bi) => (
          <Box key={b.id} bg={S.ui.highlight === b.id ? "var(--mantine-color-green-light)" : undefined} style={{ borderRadius: 8 }}>
            <Group gap={4} wrap="nowrap" px={6} pt={6}>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6}><Text fw={600} size="sm">Blocco {bi + 1}</Text><Badge size="xs" variant="default">{weeksLabel(b.weeks)}</Badge></Group>
                <PatternLine b={b} />
              </Box>
              <BlockMenu b={b} />
            </Group>
            <Stack gap={0} mt={4}>
              {b.sessions.map((s, si) => (
                <NavLink key={s.id} active={S.sel?.sessionId === s.id} label={sessionLabel(si)} description={sessionSub(s)}
                  leftSection={<ThemeIcon size="sm" variant="light" color={s.items.length ? "blue" : "yellow"}><Text size="xs" fw={700}>{si + 1}</Text></ThemeIcon>}
                  onClick={() => update(() => select(hooksB, b.id, s.id))} style={{ borderRadius: 6 }} />
              ))}
              {ed && (b.sessions.length < MAX_SESSIONS
                ? <NavLink label="Aggiungi Sessione" c="blue" leftSection={<IconPlus size={16} />} onClick={() => update(() => addSession(hooksB, b.id))} style={{ borderRadius: 6 }} />
                : <Box px="sm" py={6}><MaxNote b={b} /></Box>)}
            </Stack>
          </Box>
        ))}
        {ed && <Button mt="xs" variant="light" leftSection={<IconPlus size={16} />} onClick={() => askWeeks(update)}>Aggiungi Blocco Mensile</Button>}
      </Stack>
    </Paper>
  );
}

function ItemCard({ i, k, bId, sId }: { i: Item; k: number; bId: string; sId: string }) {
  const update = useUpdate();
  const ed = editable();
  const t = ex(i.exerciseTypeId);
  return (
    <Paper withBorder radius="md" p="sm" bg={S.ui.highlight === i.id ? "var(--mantine-color-green-light)" : undefined}
      style={{ cursor: ed ? "pointer" : undefined }} onClick={() => ed && update(() => startEdit(hooksB, bId, sId, i))}>
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <Text c="dimmed" fw={700} w={18} mt={1}>{k + 1}</Text>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6}><Text fw={600}>{t.name}</Text><VariantBadge i={i} /><Text size="xs" c="dimmed">{t.group}</Text></Group>
          <Group gap="md" mt={2}>
            <Text size="sm"><Text span c="dimmed" size="sm">Serie × rip. </Text>{setsLabel(i.reps)}</Text>
            <Text size="sm"><Text span c="dimmed" size="sm">Recupero </Text>{restLabel(i)}</Text>
          </Group>
          <VariantLines i={i} />
          {i.notes && <Text size="sm" c="dimmed" fs="italic" mt={4}>“{i.notes}”</Text>}
        </Box>
        {ed && (
          <Menu position="bottom-end" withinPortal>
            <Menu.Target><ActionIcon variant="subtle" color="gray" aria-label="Azioni sull'esercizio" onClick={(e) => e.stopPropagation()}><IconDots size={16} /></ActionIcon></Menu.Target>
            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
              <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => update(() => startEdit(hooksB, bId, sId, i))}>Modifica</Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => askRemove(bId, sId, i, update)}>Rimuovi</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Paper>
  );
}

function SessionPane() {
  const update = useUpdate();
  const sel = selected();
  const ed = editable();
  if (!sel)
    return (
      <Paper withBorder radius="md" p="xl" ta="center" style={{ borderStyle: "dashed" }}>
        <Stack align="center" gap={6}>
          <ThemeIcon size={44} radius="xl" variant="light"><IconListDetails size={24} /></ThemeIcon>
          <Text fw={500}>Scegli una sessione di allenamento</Text>
          <Text size="sm" c="dimmed">Premi su una sessione nell'elenco dei blocchi per vederne gli esercizi.</Text>
        </Stack>
      </Paper>
    );
  const { b, s } = sel;
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={3}>{where(b.id, s.id)}</Title>
          <Text size="sm" c="dimmed">{sessionSub(s)} · si ripete per {weeksLabel(b.weeks)}</Text>
        </Box>
        {ed && (
          <Group gap="xs">
            <Tooltip label="Elimina Sessione"><ActionIcon size="lg" variant="default" color="red" aria-label="Elimina Sessione" onClick={() => askDeleteSession(hooksB, b.id, s.id, update)}><IconTrash size={16} /></ActionIcon></Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={() => update(() => startAdd(hooksB))}>Aggiungi Esercizio</Button>
          </Group>
        )}
      </Group>
      {s.items.map((i, k) => <ItemCard key={i.id} i={i} k={k} bId={b.id} sId={s.id} />)}
      {!s.items.length && <Paper withBorder radius="md"><NoExercises onAdd={ed ? () => update(() => startAdd(hooksB)) : undefined} /></Paper>}
    </Stack>
  );
}

function Panel() {
  const update = useUpdate();
  const open = S.ui.bDrawer;
  const d = S.draft;
  const close = () => update(() => { S.draft = null; S.ui.bDrawer = null; });
  const title = open === "catalog"
    ? <Group gap={6}>{d && <ActionIcon variant="subtle" color="gray" aria-label="Torna al form" onClick={() => update(() => hooksB.form())}><IconChevronLeft size={16} /></ActionIcon>}<Text fw={600}>{d ? "Cambia esercizio" : "Aggiungi Esercizio"}</Text></Group>
    : <Text fw={600}>{d?.editingId ? "Modifica esercizio" : "Dettagli dell'esercizio"}</Text>;
  return (
    <Drawer opened={!!open && !!S.sel} onClose={close} position="right" size="lg" title={title} padding="lg">
      {S.sel && <Text size="xs" c="dimmed" mb="md"><IconCalendarWeek size={12} style={{ verticalAlign: -1 }} /> {where(S.sel.blockId, S.sel.sessionId)}{open === "catalog" ? " · passo 1 di 2" : d && !d.editingId ? " · passo 2 di 2" : ""}</Text>}
      {open === "catalog" && <ExerciseCatalog maxHeight="calc(100dvh - 300px)" onPick={(id) => update(() => pick(hooksB, id))} />}
      {open === "form" && d && <ExerciseForm h={hooksB} onChange={() => update(() => hooksB.catalog())} />}
    </Drawer>
  );
}

export function VariantB() {
  const update = useUpdate();
  const p = plan();
  return (
    <Stack gap="lg">
      <Breadcrumbs><Anchor size="sm" component="button" onClick={() => update(closePlan)}>Schede</Anchor><Text size="sm">{p.name}</Text></Breadcrumbs>
      <PlanTitle />
      <ReadOnlyAlert />
      {!p.blocks.length ? (editable() ? <EmptyPlan /> : null) : (
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 4 }}><Tree /></Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}><SessionPane /></Grid.Col>
        </Grid>
      )}
      <Panel />
    </Stack>
  );
}

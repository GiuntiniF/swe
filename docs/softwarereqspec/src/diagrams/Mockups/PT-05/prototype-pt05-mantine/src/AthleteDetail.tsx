// PROTOTIPO USA E GETTA. Dettaglio atleta a tab (Schede, Appuntamenti, Profilo), usato dalle varianti A e B.
import { ActionIcon, Avatar, Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconBuildingStore, IconChevronRight, IconPlus, IconTrash } from "@tabler/icons-react";
import { APPOINTMENTS, ATHLETE, endOf, fmt, fmtLong, plan, weeksOf } from "./domain";
import { DraftBadge, PeriodBadge, sortedAssignments } from "./shared";
import { type VariantHooks, S, askDiscard, notifyOutOfScope, useUpdate } from "./store";

export function AthleteDetail({ hooks, onNew }: { hooks: VariantHooks; onNew: () => void }) {
  const update = useUpdate();
  const tab = S.ui.bTab;
  return (
    <Stack gap="lg">
      <Group align="flex-start" wrap="wrap">
        <Avatar size={72} radius="xl" color="grape">{ATHLETE.initials}</Avatar>
        <Box style={{ flex: 1, minWidth: 200 }}>
          <Title order={1}>{ATHLETE.name}</Title>
          <Group gap={6} mt={6}>
            <Badge variant="default">{ATHLETE.age} anni</Badge><Badge variant="default">{ATHLETE.height} cm</Badge><Badge variant="default">{ATHLETE.weight} kg</Badge>
            <Badge variant="light" leftSection={<IconBuildingStore size={12} />}>{ATHLETE.gyms[0]}</Badge>
          </Group>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => update(onNew)}>Assegna nuova Scheda</Button>
      </Group>
      <Tabs value={tab} onChange={(v) => update(() => { S.ui.bTab = v ?? "schede"; })}>
        <Tabs.List>
          <Tabs.Tab value="schede" rightSection={<Badge size="xs" variant="light" circle>{S.assignments.length}</Badge>}>Schede</Tabs.Tab>
          <Tabs.Tab value="appuntamenti">Appuntamenti</Tabs.Tab>
          <Tabs.Tab value="profilo">Profilo</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="schede" pt="md">
          <Text size="sm" c="dimmed" mb="xs">Le bozze sono visibili solo a te finché non le confermi.</Text>
          <Paper withBorder radius="md">
            {sortedAssignments().map((a, i) => {
              const p = plan(a.planId);
              return (
                <Group key={a.id} wrap="nowrap" px="md" py="sm" bg={S.ui.highlight === a.id ? "var(--mantine-color-green-light)" : undefined}
                  style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
                  <Paper withBorder radius="sm" w={56} py={4} ta="center">
                    <Text size="xs" c="dimmed" tt="uppercase">{new Date(a.start + "T00:00:00Z").toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" })}</Text>
                    <Text size="sm" fw={700}>{a.start.slice(0, 4)}</Text>
                  </Paper>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={6}><Text fw={500}>{p.name}</Text><PeriodBadge a={a} /><DraftBadge a={a} /></Group>
                    <Text size="sm" c="dimmed">{fmt(a.start)} – {fmt(endOf(a.planId, a.start))} · {weeksOf(p)} settimane</Text>
                  </Box>
                  {a.status === "draft" ? (
                    <Group gap={4} wrap="nowrap">
                      <Button size="xs" variant="default" onClick={() => update(() => hooks.resume(a))}>Riprendi</Button>
                      <Tooltip label="Scarta la bozza"><ActionIcon variant="subtle" color="red" aria-label="Scarta la bozza" onClick={() => askDiscard(a.id, hooks, update)}><IconTrash size={16} /></ActionIcon></Tooltip>
                    </Group>
                  ) : (
                    <ActionIcon variant="subtle" color="gray" aria-label="Apri la scheda" onClick={() => notifyOutOfScope("Apri la scheda", "Il dettaglio della scheda non fa parte di questo prototipo.")}><IconChevronRight size={16} /></ActionIcon>
                  )}
                </Group>
              );
            })}
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="appuntamenti" pt="md">
          <Paper withBorder radius="md">
            {APPOINTMENTS.map((x, i) => (
              <Group key={x.date} justify="space-between" px="md" py="sm" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
                <div><Text fw={500}>{fmtLong(x.date)}</Text><Text size="sm" c="dimmed">ore {x.time}</Text></div>
                <Badge variant="light" color={x.status === "Confermato" ? "green" : "gray"}>{x.status}</Badge>
              </Group>
            ))}
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="profilo" pt="md">
          <Paper withBorder radius="md" p="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {[["Nome e cognome", ATHLETE.name], ["Email", ATHLETE.email], ["Età", `${ATHLETE.age} anni`], ["Altezza", `${ATHLETE.height} cm`], ["Peso", `${ATHLETE.weight} kg`], ["Palestre", ATHLETE.gyms.join(", ")]].map(([k, v]) => (
                <div key={k}><Text size="sm" c="dimmed">{k}</Text><Text fw={500}>{v}</Text></div>
              ))}
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

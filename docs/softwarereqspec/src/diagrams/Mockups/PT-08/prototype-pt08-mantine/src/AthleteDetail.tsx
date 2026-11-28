// PROTOTIPO USA E GETTA. Passo 4: dettaglio atleta a tab (Schede, Appuntamenti, Profilo).
// Stessa impaginazione di AthleteDetail.tsx nel prototipo PT-05; in più c'è "Termina Rapporto" (5c).
import { ActionIcon, Anchor, Avatar, Badge, Box, Breadcrumbs, Button, Group, Menu, Paper, SimpleGrid, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconBuildingStore, IconCalendarOff, IconChevronRight, IconDots, IconPlus, IconStack2, IconTrash, IconUserMinus } from "@tabler/icons-react";
import { ageOf, athlete, endOf, fmt, fmtLong, fullName, initials, sortedAppointments, sortedAssignments, TODAY } from "./domain";
import { AppointmentBadge, DraftBadge, EmptySection, PeriodBadge } from "./shared";
import { S, assignNew, backToList, discardDraft, personalize, resumeDraft, terminate, useUpdate } from "./store";

const rowBorder = (i: number) => ({ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined });

export function AthleteDetail() {
  const update = useUpdate();
  const a = athlete(S.ui.selected!);
  const schede = sortedAssignments(a);
  const appuntamenti = sortedAppointments(a);
  return (
    <Stack gap="lg">
      <Breadcrumbs>
        <Anchor size="sm" component="button" onClick={() => update(backToList)}>Atleti</Anchor>
        <Text size="sm">{fullName(a)}</Text>
      </Breadcrumbs>
      <Group align="flex-start" wrap="wrap">
        <Avatar size={72} radius="xl" color="grape">{initials(a)}</Avatar>
        <Box style={{ flex: 1, minWidth: 200 }}>
          <Title order={1}>{fullName(a)}</Title>
          <Group gap={6} mt={6}>
            <Badge variant="default">{ageOf(a)} anni</Badge><Badge variant="default">{a.height} cm</Badge><Badge variant="default">{a.weight} kg</Badge>
            {a.gyms.map((g) => <Badge key={g} variant="light" leftSection={<IconBuildingStore size={12} />}>{g}</Badge>)}
          </Group>
        </Box>
        <Group gap="xs">
          <Button leftSection={<IconPlus size={16} />} onClick={() => assignNew(a)}>Assegna nuova Scheda</Button>
          <Menu position="bottom-end">
            <Menu.Target><ActionIcon variant="default" size="lg" aria-label="Altre azioni"><IconDots size={18} /></ActionIcon></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item color="red" leftSection={<IconUserMinus size={16} />} onClick={() => terminate(a)}>Termina Rapporto</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
      <Tabs value={S.ui.bTab} onChange={(v) => update(() => { S.ui.bTab = v ?? "schede"; })}>
        <Tabs.List>
          <Tabs.Tab value="schede" rightSection={<Badge size="xs" variant="light" circle>{schede.length}</Badge>}>Schede</Tabs.Tab>
          <Tabs.Tab value="appuntamenti">Appuntamenti</Tabs.Tab>
          <Tabs.Tab value="profilo">Profilo</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="schede" pt="md">
          <Text size="sm" c="dimmed" mb="xs">Le bozze sono visibili solo a te finché non le confermi.</Text>
          <Paper withBorder radius="md">
            {schede.length === 0 && <EmptySection icon={<IconStack2 size={18} />} text="Nessuna scheda assegnata." />}
            {schede.map((s, i) => (
              <Group key={s.id} wrap="nowrap" px="md" py="sm" style={rowBorder(i)}>
                <Paper withBorder radius="sm" w={56} py={4} ta="center">
                  <Text size="xs" c="dimmed" tt="uppercase">{new Date(s.start + "T00:00:00Z").toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" })}</Text>
                  <Text size="sm" fw={700}>{s.start.slice(0, 4)}</Text>
                </Paper>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6}><Text fw={500}>{s.plan}</Text><PeriodBadge a={s} /><DraftBadge a={s} /></Group>
                  <Text size="sm" c="dimmed">{fmt(s.start)} – {fmt(endOf(s))} · {s.weeks} settimane</Text>
                </Box>
                {s.status === "draft" ? (
                  <Group gap={4} wrap="nowrap">
                    <Button size="xs" variant="default" onClick={() => resumeDraft(a, s)}>Riprendi</Button>
                    <Tooltip label="Scarta la bozza"><ActionIcon variant="subtle" color="red" aria-label="Scarta la bozza" onClick={() => discardDraft(a, s)}><IconTrash size={16} /></ActionIcon></Tooltip>
                  </Group>
                ) : (
                  <Tooltip label="Personalizza la scheda"><ActionIcon variant="subtle" color="gray" aria-label="Personalizza la scheda" onClick={() => personalize(a, s)}><IconChevronRight size={16} /></ActionIcon></Tooltip>
                )}
              </Group>
            ))}
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="appuntamenti" pt="md">
          <Paper withBorder radius="md">
            {appuntamenti.length === 0 && <EmptySection icon={<IconCalendarOff size={18} />} text="Nessun appuntamento e nessuna richiesta." />}
            {appuntamenti.map((x, i) => (
              <Group key={x.date + x.time} justify="space-between" px="md" py="sm" style={rowBorder(i)} opacity={x.date < TODAY ? 0.6 : 1}>
                <div><Text fw={500}>{fmtLong(x.date)}</Text><Text size="sm" c="dimmed">ore {x.time}</Text></div>
                <AppointmentBadge x={x} />
              </Group>
            ))}
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="profilo" pt="md">
          <Paper withBorder radius="md" p="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {[["Nome e cognome", fullName(a)], ["Email", a.email], ["Età", `${ageOf(a)} anni`], ["Altezza", `${a.height} cm`], ["Peso", `${a.weight} kg`], ["Palestre", a.gyms.join(", ") || "—"]].map(([k, v]) => (
                <div key={k}><Text size="sm" c="dimmed">{k}</Text><Text fw={500}>{v}</Text></div>
              ))}
            </SimpleGrid>
            {/* Nota 1: dati in sola lettura, li inserisce e li modifica l'atleta (A-04). */}
            <Text size="xs" c="dimmed" mt="md">Dati inseriti dall'atleta, in sola lettura.</Text>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

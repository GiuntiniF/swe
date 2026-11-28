// PROTOTIPO USA E GETTA. Badge e stati vuoti, con gli stessi colori del prototipo PT-05.
import { Badge, Center, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconPencil, IconUsers } from "@tabler/icons-react";
import { type Appointment, type Assignment, periodStatus } from "./domain";

export function PeriodBadge({ a }: { a: Assignment }) {
  const s = periodStatus(a);
  return <Badge variant="light" color={s === "In corso" ? "green" : s === "Terminata" ? "gray" : "blue"}>{s}</Badge>;
}
// Nota 5 di PT-05: le bozze sono visibili solo al PT e vanno segnalate.
export const DraftBadge = ({ a }: { a: Assignment }) =>
  a.status === "draft" ? <Badge variant="light" color="yellow" leftSection={<IconPencil size={12} />}>Bozza</Badge> : null;

const APP_COLOR = { Confermato: "green", "In attesa": "yellow", Rifiutato: "red" } as const;
export const AppointmentBadge = ({ x }: { x: Appointment }) => <Badge variant="light" color={APP_COLOR[x.status]}>{x.status}</Badge>;

/** Nota 2: la sezione resta, vuota, con un messaggio. */
export function EmptySection({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <Group gap="sm" px="md" py="lg" c="dimmed">{icon}<Text size="sm">{text}</Text></Group>;
}

/** Flusso alternativo 2a. */
export function NoAthletes() {
  return (
    <Center py={64}>
      <Stack align="center" gap="xs" maw={360} ta="center">
        <ThemeIcon size={56} radius="xl" variant="light" color="gray"><IconUsers size={30} /></ThemeIcon>
        <Text fw={600} size="lg">Nessun atleta registrato</Text>
        <Text size="sm" c="dimmed">Gli atleti compaiono qui quando li registri o quando si associano a te.</Text>
      </Stack>
    </Center>
  );
}

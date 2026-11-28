// PROTOTIPO USA E GETTA. Passi 1-2: elenco degli atleti del PT, in ordine alfabetico per cognome.
import { Paper, Stack, Table, Text, Title } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { athletesOfPt } from "./domain";
import { NoAthletes } from "./shared";
import { S, openAthlete, useUpdate } from "./store";

export function AthleteList() {
  const update = useUpdate();
  const list = athletesOfPt(S.empty);
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>I miei atleti</Title>
        <Text c="dimmed" size="sm">{list.length ? `${list.length} atleti, in ordine alfabetico per cognome.` : "Gli atleti che segui."}</Text>
      </div>
      <Paper withBorder radius="md">
        {list.length === 0 ? <NoAthletes /> : (
          <Table.ScrollContainer minWidth={480}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead><Table.Tr><Table.Th pl="md">Cognome</Table.Th><Table.Th>Nome</Table.Th><Table.Th>Email</Table.Th><Table.Th w={40} /></Table.Tr></Table.Thead>
              <Table.Tbody>
                {list.map((a) => (
                  <Table.Tr key={a.id} style={{ cursor: "pointer" }} onClick={() => update(() => openAthlete(a.id))}>
                    <Table.Td pl="md" fw={600}>{a.lastName}</Table.Td>
                    <Table.Td>{a.firstName}</Table.Td>
                    <Table.Td c="dimmed">{a.email}</Table.Td>
                    <Table.Td><IconChevronRight size={16} color="var(--mantine-color-dimmed)" style={{ display: "block" }} /></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>
    </Stack>
  );
}

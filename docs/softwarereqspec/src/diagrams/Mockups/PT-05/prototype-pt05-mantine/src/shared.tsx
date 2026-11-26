// PROTOTIPO USA E GETTA. Pezzi riusati dalle tre varianti (non il layout, che resta di ogni variante).
import { Alert, Badge, Button, Group, NumberInput, Table, Text } from "@mantine/core";
import { IconAlertTriangle, IconCalendar, IconCheck, IconCircleX, IconCornerDownRight, IconPencil } from "@tabler/icons-react";
import {
  type Assignment, type Row, type Session, EX_IDS, addDays, dropValue, endOf, fmt, hasLoad, key, kg, missingInWeek,
  periodStatus, plan, weekRanges,
} from "./domain";
import { S, flow, useUpdate } from "./store";

export function PeriodBadge({ a }: { a: Assignment }) {
  const s = periodStatus(a);
  return <Badge variant="light" color={s === "In corso" ? "green" : s === "Terminata" ? "gray" : "blue"}>{s}</Badge>;
}
export const DraftBadge = ({ a }: { a: Assignment }) =>
  a.status === "draft" ? <Badge variant="light" color="yellow" leftSection={<IconPencil size={12} />}>Bozza</Badge> : null;

export function LoadInput({ w, ex, width = 96, compact = false }: { w: number; ex: string; width?: number; compact?: boolean }) {
  const update = useUpdate();
  const f = flow();
  const k = key(w, ex);
  const has = hasLoad(f, w, ex);
  const pre = f.pre.has(k);
  return (
    <NumberInput
      aria-label="Carico in kg"
      size="xs"
      w={width}
      hideControls
      allowNegative={false}
      decimalScale={1}
      decimalSeparator=","
      suffix={compact ? undefined : " kg"}
      placeholder={compact ? "—" : "kg"}
      value={has ? (f.loads[k] as number) : ""}
      error={f.showErrors && !has}
      onChange={(v) => update(() => { f.loads[k] = v === "" ? "" : Number(v); f.pre.delete(k); })}
      styles={{ input: { textAlign: compact ? "center" : "right", fontStyle: pre ? "italic" : undefined, color: pre ? "var(--mantine-color-dimmed)" : undefined } }}
    />
  );
}

export function WeekBadge({ w }: { w: number }) {
  const f = flow();
  const m = missingInWeek(f, w);
  if (m === 0) return <Badge variant="light" color="green" leftSection={<IconCheck size={12} />}>Completa</Badge>;
  if (m === EX_IDS.length) return <Badge variant={f.showErrors ? "light" : "outline"} color={f.showErrors ? "red" : "gray"}>Da compilare</Badge>;
  return <Badge variant="light" color={f.showErrors ? "red" : "yellow"}>{m} {m === 1 ? "mancante" : "mancanti"}</Badge>;
}
export function WeekDot({ w }: { w: number }) {
  const f = flow();
  const m = missingInWeek(f, w);
  const c = m === 0 ? "var(--mantine-color-green-6)" : f.showErrors ? "var(--mantine-color-red-6)" : "var(--mantine-color-gray-5)";
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: c }} />;
}

export function FlowAlert({ onDates }: { onDates?: () => void }) {
  const f = flow();
  if (!f.error) return null;
  if (f.error.type === "missing")
    return (
      <Alert color="red" variant="light" title="Mancano dei carichi" icon={<IconAlertTriangle />}>
        Inserisci i carichi mancanti in {weekRanges(f.error.weeks)}. L'assegnazione resta in bozza finché non sono completi.
      </Alert>
    );
  const withId = f.error.with;
  const o = S.assignments.find((a) => a.id === withId);
  if (!o) return null;
  return <OverlapAlert o={o} confirm={f.error.type === "overlap-confirm"} onDates={onDates} />;
}
export function OverlapAlert({ o, confirm, onDates }: { o: Assignment; confirm?: boolean; onDates?: () => void }) {
  const f = flow();
  const oe = endOf(o.planId, o.start);
  return (
    <Alert color="red" variant="light" icon={<IconCircleX />}
      title={confirm ? "Nel frattempo è stata confermata un'altra scheda" : "Le date si sovrappongono a un'altra scheda"}>
      <Text size="sm">
        L'intervallo {fmt(f.start)} – {fmt(endOf(f.planId!, f.start))} si sovrappone a "{plan(o.planId).name}" ({fmt(o.start)} – {fmt(oe)}).
        Scegli una data di inizio dal {fmt(addDays(oe, 1))} in poi.
      </Text>
      {onDates && <Button mt="sm" size="xs" variant="default" leftSection={<IconCalendar size={14} />} onClick={onDates}>Cambia la data di inizio</Button>}
    </Alert>
  );
}

export function SessionTable({ s, w }: { s: Session; w: number }) {
  const f = flow();
  const dropRow = (r: Row) => {
    const d = dropValue(f, w, r);
    return (
      <Table.Tr key={r.id + "-drop"} bg="var(--mantine-color-default-hover)">
        <Table.Td pl="lg"><Group gap={4} c="dimmed"><IconCornerDownRight size={14} /><Text size="sm">Drop-set × {kg(r.drop!)}</Text></Group></Table.Td>
        <Table.Td><Text size="sm" c="dimmed">1 × max</Text></Table.Td>
        <Table.Td><Text size="sm" c="dimmed">—</Text></Table.Td>
        <Table.Td ta="right"><Text size="sm" c="dimmed">{d === null ? "—" : `${kg(d)} kg`} · calcolato</Text></Table.Td>
      </Table.Tr>
    );
  };
  return (
    <Table.ScrollContainer minWidth={560}>
      <Table verticalSpacing="xs" highlightOnHover>
        <Table.Thead><Table.Tr><Table.Th>Esercizio</Table.Th><Table.Th>Serie × rip.</Table.Th><Table.Th>Recupero</Table.Th><Table.Th ta="right">Carico</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {s.rows.flatMap((r) => [
            <Table.Tr key={r.id}>
              <Table.Td><Group gap="xs"><Text size="sm" fw={500}>{r.name}</Text>{r.superset && <Badge size="xs" variant="outline" color="gray">Superset {r.superset}</Badge>}</Group></Table.Td>
              <Table.Td><Text size="sm">{r.sets}</Text></Table.Td>
              <Table.Td><Text size="sm">{r.rest}</Text></Table.Td>
              <Table.Td><Group justify="flex-end"><LoadInput w={w} ex={r.id} /></Group></Table.Td>
            </Table.Tr>,
            ...(r.drop ? [dropRow(r)] : []),
          ])}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export const sortedAssignments = () => [...S.assignments].sort((a, b) => a.start.localeCompare(b.start));

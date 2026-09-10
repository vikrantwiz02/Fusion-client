import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Bank,
  FilePdf,
  FloppyDisk,
  MicrosoftExcelLogo,
  Signature,
  Trash,
} from "@phosphor-icons/react";
import axios from "axios";
import {
  assistantshipRemoveRoute,
  assistantshipSaveRoute,
  assistantshipSheetRoute,
  assistantshipSignatoryRoute,
} from "../../routes/globalRoutes";
import exportAssistantshipSheet from "./assistantshipExport";
import exportAssistantshipPdf from "./assistantshipPdf";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS = [
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
];

const authHeader = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Token ${token}` } : {};
};

// The first three columns stay put while the rest scrolls, so a row can still
// be identified at the far right of the sheet.
const FROZEN = [
  { width: 54, left: 0 },
  { width: 110, left: 54 },
  { width: 200, left: 164 },
];
const HEADER_BG = "#f8fafc";

// Sticky cells sit above the scrolling ones, so they need their own opaque
// background rather than inheriting the row's.
const stripe = (index) => (index % 2 ? "#f6f8fa" : "#ffffff");

const freeze = (index, background) => ({
  position: "sticky",
  left: FROZEN[index].left,
  zIndex: 2,
  background,
  ...(index === FROZEN.length - 1
    ? { boxShadow: "3px 0 5px -3px rgba(15,23,42,.25)" }
    : {}),
});

const freezeHead = (index) => ({
  ...freeze(index, HEADER_BG),
  zIndex: 4,
  top: 0,
});

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const statusBadge = (value, dimmed = false) => {
  if (!value)
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  return (
    <Badge
      size="sm"
      radius="sm"
      variant={dimmed ? "outline" : "light"}
      color={value === "cleared" ? "teal" : "orange"}
    >
      {value === "cleared" ? "Cleared" : "Pending"}
    </Badge>
  );
};

export default function AssistantshipPage() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [sheet, setSheet] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removing, setRemoving] = useState(false);

  const years = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 6 }, (_, i) => String(current + 1 - i));
  }, [now]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(assistantshipSheetRoute, {
        params: { month, year },
        headers: authHeader(),
      });
      setSheet(data);
      setRows(data.rows);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load the assistantship sheet.",
      );
      setSheet(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const setCell = (rollNo, field, value) =>
    setRows((prev) =>
      prev.map((row) => {
        if (row.roll_no !== rollNo) return row;
        const next = { ...row, [field]: value };
        if (field === "amount") {
          next.payable = String(Number(value || 0) + Number(row.arrears || 0));
        }
        return next;
      }),
    );

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post(
        assistantshipSaveRoute,
        { month: Number(month), year: Number(year), rows },
        { headers: authHeader() },
      );
      notifications.show({
        message: `Saved ${data.saved} ${data.saved === 1 ? "row" : "rows"}.`,
        color: "green",
      });
      load();
    } catch (err) {
      const body = err.response?.data;
      notifications.show({
        title: "Could not save",
        message:
          Object.values(body?.errors || {})[0] ||
          body?.message ||
          "Please try again.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSignatory = async (name) => {
    setSheet((prev) => ({ ...prev, recommended_by: name }));
    try {
      await axios.post(
        assistantshipSignatoryRoute,
        { recommended_by: name },
        { headers: authHeader() },
      );
    } catch {
      notifications.show({
        message: "Could not save the recommending faculty.",
        color: "red",
      });
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await axios.post(
        assistantshipRemoveRoute,
        { roll_no: pendingRemoval.roll_no },
        { headers: authHeader() },
      );
      notifications.show({
        message: `${pendingRemoval.student_name} removed from the sheet.`,
        color: "green",
      });
      setPendingRemoval(null);
      load();
    } catch (err) {
      notifications.show({
        title: "Could not remove",
        message: err.response?.data?.message || "Please try again.",
        color: "red",
      });
    } finally {
      setRemoving(false);
    }
  };

  const total = rows.reduce((sum, row) => sum + Number(row.payable || 0), 0);

  const exportPayload = () => ({
    discipline: sheet.discipline,
    disciplineCode: sheet.discipline_code,
    monthName: sheet.month_name,
    year: sheet.year,
    rows,
    recommendedBy: sheet.recommended_by,
  });

  if (loading) {
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Paper withBorder radius="md" p="lg">
        <Text c="red">{error}</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" radius="md" size="lg" color="blue">
              <Bank size={18} />
            </ThemeIcon>
            <div>
              <Text fw={600}>{sheet.discipline} Discipline</Text>
              <Text size="xs" c="dimmed">
                Assistantship for the Month of {sheet.month_name}, {sheet.year}
              </Text>
            </div>
          </Group>

          <Group gap="sm" align="flex-end">
            <Select
              label="Month"
              data={MONTHS.map((name, index) => ({
                value: String(index + 1),
                label: name,
              }))}
              value={month}
              onChange={(value) => value && setMonth(value)}
              w={140}
            />
            <Select
              label="Year"
              data={years}
              value={year}
              onChange={(value) => value && setYear(value)}
              w={110}
            />
            <Button
              leftSection={<FloppyDisk size={16} />}
              onClick={save}
              loading={saving}
              disabled={!rows.length}
            >
              Save
            </Button>
            <Button
              variant="light"
              leftSection={<MicrosoftExcelLogo size={16} />}
              disabled={!rows.length}
              onClick={() => exportAssistantshipSheet(exportPayload())}
            >
              Excel
            </Button>
            <Button
              variant="light"
              color="red"
              leftSection={<FilePdf size={16} />}
              disabled={!rows.length}
              onClick={() => exportAssistantshipPdf(exportPayload())}
            >
              PDF
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper withBorder radius="md" p="lg" shadow="xs">
        <Group justify="space-between" mb="sm" wrap="wrap" gap="sm">
          <Group gap="xs">
            <Badge variant="light" radius="sm">
              {rows.length} students
            </Badge>
            <Badge variant="light" color="teal" radius="sm">
              Total ₹{money(total)}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Days, amount and remark are editable. A pending month is added to
            the next one.
          </Text>
        </Group>

        {/* A plain scroller: Mantine's ScrollArea gives its content
            display:table, which stops position:sticky from working. */}
        {rows.length ? (
          <Box
            style={{
              maxHeight: "58vh",
              overflow: "auto",
              position: "relative",
            }}
          >
            <Table
              withTableBorder
              withColumnBorders
              miw={1560}
              verticalSpacing="xs"
              style={{ borderCollapse: "separate", borderSpacing: 0 }}
            >
              <Table.Thead
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  background: HEADER_BG,
                }}
              >
                <Table.Tr>
                  <Table.Th w={FROZEN[0].width} style={freezeHead(0)}>
                    S.No
                  </Table.Th>
                  <Table.Th w={FROZEN[1].width} style={freezeHead(1)}>
                    Roll No.
                  </Table.Th>
                  <Table.Th w={FROZEN[2].width} style={freezeHead(2)}>
                    Student Name
                  </Table.Th>
                  <Table.Th w={150}>Joining Date</Table.Th>
                  <Table.Th w={150}>Account No</Table.Th>
                  <Table.Th w={130}>IFSC Code</Table.Th>
                  <Table.Th w={130}>Bank Name</Table.Th>
                  <Table.Th w={90}>No. of Days</Table.Th>
                  <Table.Th w={130}>Amount</Table.Th>
                  <Table.Th w={220}>Remark</Table.Th>
                  <Table.Th w={110}>Last Month</Table.Th>
                  <Table.Th w={130}>Status</Table.Th>
                  <Table.Th w={60}>Remove</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, index) => (
                  <Table.Tr
                    key={row.roll_no}
                    style={{ background: stripe(index) }}
                  >
                    <Table.Td style={freeze(0, stripe(index))}>
                      {index + 1}
                    </Table.Td>
                    <Table.Td style={freeze(1, stripe(index))}>
                      {row.roll_no}
                    </Table.Td>
                    <Table.Td style={freeze(2, stripe(index))}>
                      {row.student_name}
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        type="date"
                        value={row.joining_date || ""}
                        onChange={(event) =>
                          setCell(
                            row.roll_no,
                            "joining_date",
                            event.currentTarget.value,
                          )
                        }
                      />
                    </Table.Td>
                    <Table.Td>{row.account_no || "—"}</Table.Td>
                    <Table.Td>{row.ifsc_code || "—"}</Table.Td>
                    <Table.Td>{row.bank_name || "—"}</Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={String(row.days ?? "")}
                        onChange={(event) =>
                          setCell(
                            row.roll_no,
                            "days",
                            event.currentTarget.value.replace(/\D/g, ""),
                          )
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={String(row.amount ?? "")}
                        onChange={(event) =>
                          setCell(
                            row.roll_no,
                            "amount",
                            event.currentTarget.value.replace(/[^\d.]/g, ""),
                          )
                        }
                      />
                      {Number(row.arrears) > 0 && (
                        <Text size="xs" c="orange" mt={2}>
                          + ₹{money(row.arrears)} carried → ₹
                          {money(row.payable)}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        size="xs"
                        value={row.remark || ""}
                        onChange={(event) =>
                          setCell(
                            row.roll_no,
                            "remark",
                            event.currentTarget.value,
                          )
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      {statusBadge(row.last_month_status, true)}
                    </Table.Td>
                    <Table.Td>
                      <Select
                        size="xs"
                        data={STATUS}
                        value={row.status}
                        allowDeselect={false}
                        onChange={(value) =>
                          setCell(row.roll_no, "status", value || "pending")
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`Remove ${row.student_name}`}
                        onClick={() => setPendingRemoval(row)}
                      >
                        <Trash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        ) : (
          <Text size="sm" c="dimmed" py="xl" ta="center">
            No PG or PhD students on record for this discipline.
          </Text>
        )}
      </Paper>

      <Modal
        opened={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        title="Remove from the assistantship sheet?"
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            <Text span fw={600}>
              {pendingRemoval?.student_name}
            </Text>{" "}
            ({pendingRemoval?.roll_no}) will no longer appear on the{" "}
            {sheet.discipline} sheet for any month.
          </Text>
          <Text size="xs" c="dimmed">
            Their student record is not deleted — only this listing skips them.
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => setPendingRemoval(null)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<Trash size={16} />}
              onClick={remove}
              loading={removing}
            >
              Remove
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Paper withBorder radius="md" p="lg" shadow="xs">
        <Group gap="sm" wrap="nowrap" mb="sm">
          <ThemeIcon variant="light" radius="md" size="lg" color="blue">
            <Signature size={18} />
          </ThemeIcon>
          <div>
            <Text fw={600}>Recommended By</Text>
            <Text size="xs" c="dimmed">
              Printed under the sheet as Head, {sheet.discipline_code}. Saved
              until you change it.
            </Text>
          </div>
        </Group>
        <Select
          searchable
          placeholder="Select a faculty member"
          data={sheet.faculty}
          value={sheet.recommended_by || null}
          onChange={(value) => value && saveSignatory(value)}
          maw={420}
        />
      </Paper>
    </Stack>
  );
}

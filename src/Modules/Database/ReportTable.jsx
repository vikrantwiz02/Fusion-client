import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { IconDownload, IconSearch } from "@tabler/icons-react";

// Every report shows a serial number, searches across all its columns and
// exports what is on screen, so that behaviour lives here rather than in each.
const SERIAL_LABEL = "S. No.";
const HEADER_FILL = "FF366092";

// A workbook rather than a csv, so the export carries the ruled grid and
// header the office's other exports have. exceljs is lazy-loaded.
async function writeWorkbook(columns, rows, filename, sheetName) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || "Report");

  sheet.columns = [
    { header: SERIAL_LABEL, key: "__serial__", width: 8 },
    ...columns.map((column) => ({
      header: column.label,
      key: column.key,
      width: Math.max(12, Math.min(45, column.label.length + 6)),
    })),
  ];

  rows.forEach((row, index) => {
    sheet.addRow({
      __serial__: index + 1,
      ...Object.fromEntries(
        columns.map((column) => [column.key, row[column.key] ?? ""]),
      ),
    });
  });

  const thin = { style: "thin", color: { argb: "FF9AA5B1" } };
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (rowNumber === 1) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_FILL },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReportTable({ columns, rows, filename, badges = [] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      columns.some((column) =>
        String(row[column.key] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [columns, rows, query]);

  const [exporting, setExporting] = useState(false);

  const download = async () => {
    setExporting(true);
    try {
      await writeWorkbook(columns, visible, `${filename}.xlsx`, filename);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="Search these rows"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ flex: 1, minWidth: 220, maxWidth: 420 }}
        />
        <Button
          variant="light"
          leftSection={<IconDownload size={16} />}
          onClick={download}
          loading={exporting}
          disabled={!visible.length}
          style={{ flexShrink: 0 }}
        >
          Download Excel
        </Button>
      </Group>

      <Group gap="xs">
        <Badge color="blue">
          {query.trim()
            ? `${visible.length} of ${rows.length} rows`
            : `${rows.length} rows`}
        </Badge>
        {badges?.map((badge) => (
          <Badge key={badge.label} color={badge.color}>
            {badge.label}
          </Badge>
        ))}
      </Group>

      {visible.length === 0 ? (
        <Text size="sm" c="dimmed">
          {rows.length ? "Nothing matches that search." : "No rows to show."}
        </Text>
      ) : (
        <ScrollArea.Autosize mah="58vh" type="auto">
          <Table striped highlightOnHover withTableBorder miw={1100}>
            <Table.Thead
              style={{ position: "sticky", top: 0, background: "#f8fafc" }}
            >
              <Table.Tr>
                <Table.Th w={70}>{SERIAL_LABEL}</Table.Th>
                {columns.map((column) => (
                  <Table.Th key={column.key}>{column.label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visible.map((row, index) => (
                <Table.Tr
                  key={`${index}-${columns.map((c) => row[c.key]).join("|")}`}
                >
                  <Table.Td>{index + 1}</Table.Td>
                  {columns.map((column) => (
                    <Table.Td key={column.key}>{row[column.key]}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}

ReportTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({ key: PropTypes.string, label: PropTypes.string }),
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.any)).isRequired,
  filename: PropTypes.string.isRequired,
  badges: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string, color: PropTypes.string }),
  ),
};

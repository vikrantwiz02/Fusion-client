import { useMemo, useState } from "react";
import {
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowRight, IconSearch, IconTable } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { DATABASE_REPORTS } from "./reports";

export default function ViewDatabase() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return DATABASE_REPORTS;
    return DATABASE_REPORTS.filter((report) =>
      [report.title, report.summary, report.filters]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Text size="sm" c="dimmed">
          Pick a report to choose its filters, preview the rows and export them.
        </Text>
        <TextInput
          leftSection={<IconSearch size={16} />}
          placeholder="Search reports"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
        />
      </Group>
      {visible.length === 0 && (
        <Text size="sm" c="dimmed">
          No report matches that search.
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {visible.map((report) => (
          <Card
            key={report.id}
            withBorder
            padding="md"
            radius="md"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/database/view/${report.id}`)}
          >
            <Group justify="space-between" align="flex-start" mb="xs">
              <ThemeIcon variant="light" size="lg" radius="md">
                <IconTable size={18} />
              </ThemeIcon>
              <IconArrowRight size={16} opacity={0.4} />
            </Group>
            <Text fw={600}>{report.title}</Text>
            <Text size="sm" c="dimmed" mt={4}>
              {report.summary}
            </Text>
            <Text size="xs" c="dimmed" mt="sm">
              Filters: {report.filters}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { databaseStudentCreditTotalsRoute } from "../../../routes/academicRoutes";
import ReportTable from "../ReportTable";

const COLUMNS = [
  { key: "roll_no", label: "Roll No" },
  { key: "student_name", label: "Student Name" },
  { key: "total_credits", label: "Total Credits" },
];

const asOptions = (values) =>
  (values || []).map((v) => ({ value: String(v), label: String(v) }));

export default function StudentCreditTotalsReport({ filters }) {
  const [session, setSession] = useState(null);
  const [semesterType, setSemesterType] = useState(null);
  const [batch, setBatch] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ready = Boolean(session && semesterType && batch);

  const run = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(databaseStudentCreditTotalsRoute, {
        params: { session, semester_type: semesterType, batch },
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      setResult(data);
      if (!data.count) {
        showNotification({
          title: "Nothing found",
          message: "No registrations match those filters.",
          color: "yellow",
        });
      }
    } catch (error) {
      showNotification({
        title: "Error",
        message: error.response?.data?.detail || "Could not load the credits.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group align="flex-end" gap="md">
        <Select
          label="Session"
          placeholder="Select session"
          data={asOptions(filters.sessions)}
          value={session}
          onChange={setSession}
          style={{ flex: 1, minWidth: 150 }}
        />
        <Select
          label="Semester Type"
          placeholder="Select semester type"
          data={asOptions(filters.semester_types)}
          value={semesterType}
          onChange={setSemesterType}
          style={{ flex: 1, minWidth: 170 }}
        />
        <Select
          label="Batch"
          placeholder="Select batch"
          data={asOptions(filters.batches)}
          value={batch}
          onChange={setBatch}
          style={{ flex: 1, minWidth: 130 }}
        />
        <Button
          leftSection={<IconSearch size={16} />}
          onClick={run}
          loading={loading}
          disabled={!ready}
          style={{ flexShrink: 0 }}
        >
          Fetch
        </Button>
      </Group>

      {result ? (
        <ReportTable
          columns={COLUMNS}
          rows={result.rows}
          filename={`total_credits_${session}_${String(semesterType).replace(/\s+/g, "_")}_${batch}`}
          badges={[{ label: `${result.credits} credits`, color: "teal" }]}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Choose a session, semester type and batch, then fetch.
        </Text>
      )}
    </Stack>
  );
}

StudentCreditTotalsReport.propTypes = {
  filters: PropTypes.shape({
    sessions: PropTypes.arrayOf(PropTypes.string),
    semester_types: PropTypes.arrayOf(PropTypes.string),
    batches: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
};

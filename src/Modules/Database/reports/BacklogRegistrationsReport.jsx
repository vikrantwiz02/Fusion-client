import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { databaseBacklogRegistrationsRoute } from "../../../routes/academicRoutes";
import ReportTable from "../ReportTable";

const COLUMNS = [
  { key: "roll_no", label: "Roll No" },
  { key: "name", label: "Name" },
  { key: "semester", label: "Semester" },
  { key: "course_slot", label: "Course Slot" },
  { key: "course_code", label: "Course Code" },
  { key: "course_name", label: "Course Name" },
  { key: "registration_type", label: "Reg. Type" },
];

const asOptions = (values) =>
  (values || []).map((v) => ({ value: String(v), label: String(v) }));

export default function BacklogRegistrationsReport({ filters }) {
  const [session, setSession] = useState(null);
  const [semesterType, setSemesterType] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(databaseBacklogRegistrationsRoute, {
        params: { session, semester_type: semesterType },
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      setResult(data);
      if (!data.count) {
        showNotification({
          title: "Nothing found",
          message: "No backlog-slot registrations match those filters.",
          color: "yellow",
        });
      }
    } catch (error) {
      showNotification({
        title: "Error",
        message: error.response?.data?.detail || "Could not load the rows.",
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
        <Button
          leftSection={<IconSearch size={16} />}
          onClick={run}
          loading={loading}
          disabled={!session || !semesterType}
          style={{ flexShrink: 0 }}
        >
          Fetch
        </Button>
      </Group>

      {result ? (
        <ReportTable
          columns={COLUMNS}
          rows={result.rows}
          filename={`backlog_registrations_${session}_${String(semesterType).replace(/\s+/g, "_")}`}
          badges={[{ label: `${result.students} students`, color: "grape" }]}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Choose a session and semester type, then fetch.
        </Text>
      )}
    </Stack>
  );
}

BacklogRegistrationsReport.propTypes = {
  filters: PropTypes.shape({
    sessions: PropTypes.arrayOf(PropTypes.string),
    semester_types: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

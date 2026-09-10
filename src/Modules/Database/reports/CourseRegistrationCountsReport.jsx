import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { databaseCourseRegistrationCountsRoute } from "../../../routes/academicRoutes";
import ReportTable from "../ReportTable";

const COLUMNS = [
  { key: "course_code", label: "Course Code" },
  { key: "course_name", label: "Course Name" },
  { key: "registered", label: "Registered" },
];

const asOptions = (values) =>
  (values || []).map((v) => ({ value: String(v), label: String(v) }));

const PROGRAMME_LABELS = { UG: "UG", PG: "PG", PHD: "PhD" };

const programmeOptions = (categories) => [
  { value: "ALL", label: "All" },
  ...(categories || []).map((c) => ({
    value: c,
    label: PROGRAMME_LABELS[c] || c,
  })),
];

export default function CourseRegistrationCountsReport({ filters }) {
  const [session, setSession] = useState(null);
  const [semesterType, setSemesterType] = useState(null);
  const [programme, setProgramme] = useState("ALL");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ready = Boolean(session && semesterType);

  const run = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(databaseCourseRegistrationCountsRoute, {
        params: { session, semester_type: semesterType, programme },
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
        message: error.response?.data?.detail || "Could not load the counts.",
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
          label="Programme"
          data={programmeOptions(filters.programme_categories)}
          value={programme}
          onChange={(value) => setProgramme(value || "ALL")}
          allowDeselect={false}
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
          filename={`course_registration_counts_${session}_${String(semesterType).replace(/\s+/g, "_")}_${programme.toLowerCase()}`}
          badges={[
            { label: `${result.registrations} registrations`, color: "grape" },
          ]}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Choose a session and semester type, then fetch.
        </Text>
      )}
    </Stack>
  );
}

CourseRegistrationCountsReport.propTypes = {
  filters: PropTypes.shape({
    sessions: PropTypes.arrayOf(PropTypes.string),
    semester_types: PropTypes.arrayOf(PropTypes.string),
    programme_categories: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

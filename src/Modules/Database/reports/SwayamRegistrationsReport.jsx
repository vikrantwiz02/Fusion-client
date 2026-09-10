import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { databaseSwayamRegistrationsRoute } from "../../../routes/academicRoutes";
import ReportTable from "../ReportTable";

const COLUMNS = [
  { key: "roll_no", label: "Roll No" },
  { key: "student_name", label: "Student Name" },
  { key: "course_code", label: "Course Code" },
  { key: "course_name", label: "Course Name" },
  { key: "semester_no", label: "Semester No" },
];

const asOptions = (values) =>
  (values || []).map((v) => ({ value: String(v), label: String(v) }));

export default function SwayamRegistrationsReport({ filters }) {
  const [session, setSession] = useState(null);
  const [semesterType, setSemesterType] = useState(null);
  const [batch, setBatch] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ready = Boolean(session && semesterType);

  const run = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(databaseSwayamRegistrationsRoute, {
        params: {
          session,
          semester_type: semesterType,
          ...(batch ? { batch } : {}),
        },
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      setResult({
        ...data,
        rows: data.rows.map((row) => ({
          ...row,
          semester_no: row.semester_no ?? "",
        })),
      });
      if (!data.count) {
        showNotification({
          title: "Nothing found",
          message: "No Swayam registrations match those filters.",
          color: "yellow",
        });
      }
    } catch (error) {
      showNotification({
        title: "Error",
        message:
          error.response?.data?.detail ||
          "Could not load the Swayam registrations.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const badges = result
    ? [
        { label: `${result.students} students`, color: "grape" },
        ...(result.without_slot
          ? [
              {
                label: `${result.without_slot} without a course slot`,
                color: "orange",
              },
            ]
          : []),
      ]
    : [];

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
          label={
            <>
              Batch{" "}
              <Text component="span" size="xs" c="dimmed" fw={400}>
                (optional)
              </Text>
            </>
          }
          placeholder="All batches"
          data={asOptions(filters.batches)}
          value={batch}
          onChange={setBatch}
          clearable
          style={{ flex: 1, minWidth: 140 }}
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
          filename={`swayam_registrations_${session}_${String(semesterType).replace(/\s+/g, "_")}${batch ? `_${batch}` : ""}`}
          badges={badges}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Choose a session and semester type, then fetch.
        </Text>
      )}
    </Stack>
  );
}

SwayamRegistrationsReport.propTypes = {
  filters: PropTypes.shape({
    sessions: PropTypes.arrayOf(PropTypes.string),
    semester_types: PropTypes.arrayOf(PropTypes.string),
    batches: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
};

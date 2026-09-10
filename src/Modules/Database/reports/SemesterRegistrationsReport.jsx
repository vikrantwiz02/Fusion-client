import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { databaseSemesterRegistrationsRoute } from "../../../routes/academicRoutes";
import ReportTable from "../ReportTable";

const COLUMNS = [
  { key: "roll_no", label: "Roll No" },
  { key: "semester", label: "Semester" },
  { key: "student_name", label: "Student Name" },
  { key: "course_code", label: "Course Code" },
  { key: "course_name", label: "Course Name" },
  { key: "credit", label: "Credit" },
  { key: "semester_type", label: "Semester Type" },
  { key: "registration_type", label: "Reg. Type" },
];

const asOptions = (values) =>
  (values || []).map((v) => ({ value: String(v), label: String(v) }));

export default function SemesterRegistrationsReport({ filters }) {
  const [batch, setBatch] = useState(null);
  const [semester, setSemester] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const ready = Boolean(batch && semester);

  const run = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(databaseSemesterRegistrationsRoute, {
        params: { batch, semester },
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
        message:
          error.response?.data?.detail || "Could not load the registrations.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const badges = result
    ? [
        { label: `${result.students} students`, color: "grape" },
        { label: `${result.credits} credits`, color: "teal" },
        ...(result.duplicates_removed
          ? [
              {
                label: `${result.duplicates_removed} duplicates removed`,
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
          label="Batch"
          placeholder="Select batch"
          data={asOptions(filters.batches)}
          value={batch}
          onChange={setBatch}
          style={{ flex: 1, minWidth: 150 }}
        />
        <Select
          label="Semester"
          placeholder="Select semester"
          data={asOptions(filters.semesters)}
          value={semester}
          onChange={setSemester}
          style={{ flex: 1, minWidth: 150 }}
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
          filename={`semester_registrations_${batch}_sem${semester}`}
          badges={badges}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Choose a batch and semester, then fetch.
        </Text>
      )}
    </Stack>
  );
}

SemesterRegistrationsReport.propTypes = {
  filters: PropTypes.shape({
    batches: PropTypes.arrayOf(PropTypes.number),
    semesters: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
};

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Text,
  Button,
  Group,
  Select,
  Tabs,
  Box,
  Loader,
  Alert,
  TextInput,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

import {
  availableCoursesRoute,   // NEW endpoint: GET /api/available-courses/
  generatexlsheet,         // POST /api/generate-xlsheet/
  batchesRoute,            // unchanged: for prereg tab
  generateprereport,       // unchanged: for prereg tab
} from "../../routes/academicRoutes";

const ACADEMIC_YEARS = [
  "2021-22",
  "2022-23",
  "2023-24",
  "2024-25",
  "2025-26",
  "2026-27",
];

const SEMESTER_CHOICES = [
  { value: "Odd Semester", label: "Odd Semester" },
  { value: "Even Semester", label: "Even Semester" },
  { value: "Summer Semester", label: "Summer Semester" },
];

export default function GenerateStudentList() {
  const [activeTab, setActiveTab]       = useState("rolllist");

  // Roll List states
  const [academicYear, setAcademicYear] = useState("");
  const [semesterType, setSemesterType] = useState("");
  const [course, setCourse]             = useState("");
  const [courseOptions, setCourseOptions] = useState([]);

  // Pre-Registration states (unchanged)
  const [batch, setBatch]               = useState("");
  const [semester, setSemester]         = useState("");
  const [batchOptions, setBatchOptions] = useState([]);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  // 1) Fetch available courses once year+semester are set
  const fetchCourses = useCallback(async () => {
    if (!academicYear || !semesterType) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No auth token");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(availableCoursesRoute, {
        params: { academic_year: academicYear, semester_type: semesterType },
        headers: { Authorization: `Token ${token}` },
      });
      // Expect [{ id, code, name }, ...]
      setCourseOptions(
        res.data.map(c => ({
          value: String(c.id),
          label: `${c.code} - ${c.name}`,
        }))
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [academicYear, semesterType]);

  useEffect(() => {
    if (activeTab === "rolllist") {
      fetchCourses();
    }
  }, [activeTab, fetchCourses]);

  // 2) Generate Roll List Excel
  const handleGenerateList = async () => {
    if (!academicYear || !semesterType || !course) {
      showNotification({
        title: "Missing fields",
        message: "Select year, semester & course",
        color: "yellow",
      });
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.post(
        generatexlsheet,
        {
          academic_year: academicYear,
          semester_type: semesterType,
          course,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `RollList_${course}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      showNotification({ title: "Error", message: err.message, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  // 3) Fetch batches for Pre‐Registration when that tab is active
  useEffect(() => {
    if (activeTab !== "preregistration") return;
    const fetchBatches = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(batchesRoute, {
          headers: { Authorization: `Token ${token}` },
        });
        setBatchOptions(
          res.data.batches.map(b => ({
            value: String(b.batch_id),
            label: `${b.name} ${b.discipline} ${b.year}`,
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [activeTab]);

  // 4) Generate Pre-Registration Report (unchanged)
  const generatePreRegistrationReport = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.post(
        generateprereport,
        { semester_no: semester, batch_branch: batch },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PreReg_${batch}_${semester}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="rolllist">Roll List</Tabs.Tab>
          <Tabs.Tab value="preregistration">Pre-Registration</Tabs.Tab>
        </Tabs.List>

        {/* Roll List Tab */}
        <Tabs.Panel value="rolllist" pt="md">
          <Text size="lg" weight={700} align="center" mb="md" color="blue">
            Generate Student Roll List
          </Text>

          <Group grow mb="md">
            <Select
              label="Academic Year"
              placeholder="2024-25"
              data={ACADEMIC_YEARS.map(y => ({ value: y, label: y }))}
              value={academicYear}
              onChange={setAcademicYear}
            />
            <Select
              label="Semester Type"
              placeholder="Odd Semester"
              data={SEMESTER_CHOICES}
              value={semesterType}
              onChange={setSemesterType}
            />
          </Group>

          {error ? (
            <Alert color="red">{error}</Alert>
          ) : (
            <Select
              label="Course"
              placeholder="Select course"
              data={courseOptions}
              value={course}
              onChange={setCourse}
              searchable
              mb="md"
            />
          )}

          <Button
            fullWidth
            onClick={handleGenerateList}
            loading={loading}
            disabled={!academicYear || !semesterType || !course}
          >
            Generate Student List
          </Button>
        </Tabs.Panel>

        {/* Pre-Registration Tab (logic unchanged) */}
        <Tabs.Panel value="preregistration" pt="md">
          <Text size="lg" weight={700} align="center" mb="md" color="blue">
            Pre-Registration Report
          </Text>

          <Group grow mb="md">
            <TextInput
              label="Semester"
              placeholder="Select Semester"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            />
            <Select
              label="Batch"
              placeholder="Select Batch"
              data={batchOptions}
              value={batch}
              onChange={setBatch}
              searchable
            />
          </Group>

          <Button
            fullWidth
            onClick={generatePreRegistrationReport}
            loading={loading}
            disabled={!semester || !batch}
          >
            Generate Pre-Registration Report
          </Button>
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}

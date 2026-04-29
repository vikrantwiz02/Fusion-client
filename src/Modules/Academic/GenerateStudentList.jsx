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
  Modal,
  Paper,
  Stack,
  Table,
  ScrollArea,
  Title,
  Badge,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

import {
  availableCoursesRoute,
  generatexlsheet,
  exportAllCoursesZipRoute,
  listBatchesRoute,
  generateprereport,
} from "../../routes/academicRoutes";

const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear;
  const years = [];
  for (let y = endYear; y >= 2020; y--) {
    years.push(`${y}-${String(y + 1).slice(-2)}`);
  }
  return years;
};

const ACADEMIC_YEARS = generateAcademicYears();

const SEMESTER_CHOICES = [
  { value: "Odd Semester", label: "Odd Semester" },
  { value: "Even Semester", label: "Even Semester" },
  { value: "Summer Semester", label: "Summer Semester" },
];

const PROGRAMME_TYPE_CHOICES = [
  { value: "UG", label: "Undergraduate (UG)" },
  { value: "PG", label: "Postgraduate (PG)" },
  { value: "All", label: "All Programmes" },
];

const LIST_TYPE_CHOICES = [
  { value: "Regular", label: "Regular" },
  { value: "Backlog", label: "Backlog" },
  { value: "Improvement", label: "Improvement" },
  { value: "Audit", label: "Audit" },
  { value: "Extra Credits", label: "Extra Credits" },
  { value: "Replacement", label: "Replacement" },
];

export default function GenerateStudentList() {
  const [activeTab, setActiveTab]       = useState("rolllist");

  // Roll List states
  const [academicYear, setAcademicYear] = useState("");
  const [semesterType, setSemesterType] = useState("");
  const [programmeType, setProgrammeType] = useState("All");
  const [listType, setListType]         = useState("");
  const [course, setCourse]             = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Pre-Registration states
  const [batch, setBatch]                     = useState("");
  const [semester, setSemester]               = useState("");
  const [batchOptions, setBatchOptions]       = useState([]);
  const [preRegData, setPreRegData]           = useState(null);   // { title, batch_name, semester, students, max_choices }
  const [preRegLoading, setPreRegLoading]     = useState(false);
  const [preRegError, setPreRegError]         = useState(null);
  const [preRegSearch, setPreRegSearch]       = useState("");
  const [preRegStatusFilter, setPreRegStatusFilter] = useState("All");
  const [exportLoading, setExportLoading]     = useState(false);

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [exportAllLoading, setExportAllLoading] = useState(false);

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
      // Expect [{ id, code, name, instructor }, ...]
      setCourseOptions(
        res.data.map(c => ({
          value: String(c.id),
          label: `${c.code} - ${c.name}`,
          instructor: c.instructor || 'TBA',
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

  // 2) Handle Preview for All Types
  const handlePreview = async () => {
    if (!academicYear || !semesterType || !course) {
      showNotification({
        title: "Missing fields",
        message: "Select year, semester, and course first",
        color: "yellow",
      });
      return;
    }

    setPreviewLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const payload = {
        academic_year: academicYear,
        semester_type: semesterType,
        course,
        preview_only: true,
      };
      if (listType && listType.trim() !== '') {
        payload.list_type = listType;
      }
      if (programmeType && programmeType !== 'All') {
        payload.programme_type = programmeType;
      }

      const res = await axios.post(generatexlsheet, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      let students = res.data.students || res.data || [];
      
      setPreviewData(students);
      setShowPreview(true);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.data?.detail?.includes("preview_only")) {
        setPreviewData([]);
        setShowPreview(true);
      } else {
        showNotification({ 
          title: "Error", 
          message: "Failed to fetch preview data: " + (err.response?.data?.detail || err.message), 
          color: "red" 
        });
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // 3) Export ALL courses as ZIP
  const handleExportAllZip = async () => {
    setExportAllLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const payload = { academic_year: academicYear, semester_type: semesterType };
      if (listType && listType.trim()) payload.list_type = listType;
      if (programmeType && programmeType !== "All") payload.programme_type = programmeType;

      const res = await axios.post(exportAllCoursesZipRoute, payload, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        responseType: "blob",
      });

      const filename = `${academicYear.replace("-", "_")}_${semesterType.replace(/ /g, "_")}_All_Courses.zip`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showNotification({ title: "Downloaded", message: `${courseOptions.length} courses exported as ZIP`, color: "green" });
    } catch (err) {
      showNotification({ title: "Export failed", message: err.response?.data?.error || err.message, color: "red" });
    } finally {
      setExportAllLoading(false);
    }
  };

  // 4) Generate Roll List Excel
  const handleGenerateList = async () => {
    if (!academicYear || !semesterType || !course) {
      showNotification({
        title: "Missing fields",
        message: "Select year, semester, and course",
        color: "yellow",
      });
      return;
    }

    await handlePreview();
  };

  // 5) Confirm and generate after preview
  const handleConfirmGenerate = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const payload = {
        academic_year: academicYear,
        semester_type: semesterType,
        course,
      };

      if (listType && listType.trim() !== '') {
        payload.list_type = listType;
      }
      if (programmeType && programmeType !== 'All') {
        payload.programme_type = programmeType;
      }

      const res = await axios.post(generatexlsheet, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        responseType: "blob",
      });

      // Filename from course code and course name
      const selectedCourse = courseOptions.find(c => c.value === course);
      let courseCode = 'Course';
      let courseName = 'List';
      
      if (selectedCourse) {
        const parts = selectedCourse.label.split(' - ');
        if (parts.length >= 2) {
          courseCode = parts[0].trim();
          courseName = parts[1].trim();
        } else {
          courseName = selectedCourse.label;
        }
      }
      const courseNameClean = courseName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `${courseCode}_${courseNameClean}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowPreview(false);
      const listTypeName = listType || "All";
      const progTypeName = programmeType && programmeType !== 'All' ? ` (${programmeType})` : '';
      showNotification({
        title: "Success",
        message: `${listTypeName} student list${progTypeName} generated successfully`,
        color: "green",
      });
    } catch (err) {
      console.error("Generate List Error:", err);
      showNotification({ 
        title: "Error", 
        message: err.response?.data?.detail || err.message, 
        color: "red" 
      });
    } finally {
      setLoading(false);
    }
  };

  // 5) Fetch batches for Pre‐Registration when that tab is active
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
        const res = await axios.get(listBatchesRoute, {
          headers: { Authorization: `Token ${token}` },
        });
        
        setBatchOptions(
          (res.data.batches || res.data).map(b => ({
            value: String(b.batch_id || b.id),
            label: `${b.name || b.label || `Batch ${b.year}`} ${b.discipline || ''}`,
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

  // 6) Fetch Pre-Registration data for inline display
  const fetchPreRegistrationReport = async () => {
    if (!semester || !batch) {
      showNotification({ title: "Missing fields", message: "Select semester and batch", color: "yellow" });
      return;
    }
    setPreRegLoading(true);
    setPreRegError(null);
    setPreRegData(null);
    setPreRegSearch("");
    setPreRegStatusFilter("All");
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.post(
        generateprereport,
        { semester_no: semester, batch_branch: batch, preview_only: true },
        {
          headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        }
      );
      setPreRegData(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Failed to fetch report";
      setPreRegError(msg);
      showNotification({ title: "Error", message: msg, color: "red" });
    } finally {
      setPreRegLoading(false);
    }
  };

  // 7) Export Pre-Registration data as XLSX (respects active status filter)
  const exportPreRegistrationReport = async () => {
    if (!semester || !batch) return;
    setExportLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const payload = { semester_no: semester, batch_branch: batch };
      // Pass filter so backend exports only the relevant subset
      if (preRegStatusFilter !== "All") {
        payload.status_filter = preRegStatusFilter;  // "Registered" | "Not Registered"
      }

      const res = await axios.post(generateprereport, payload, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        responseType: "blob",
      });

      // Filename: {BatchLabel}_Sem{N}_{Filter}.xlsx
      const batchLabel = batchOptions.find(b => b.value === batch)?.label || `Batch_${batch}`;
      const filterSuffix = preRegStatusFilter !== "All"
        ? `_${preRegStatusFilter.replace(/\s+/g, "_")}`
        : "";
      const safeName = `${batchLabel}_Sem${semester}${filterSuffix}`
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      const filename = `${safeName}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification({ title: "Exported", message: `Downloaded as ${filename}`, color: "green" });
    } catch (err) {
      showNotification({ title: "Export failed", message: err.response?.data?.detail || err.message, color: "red" });
    } finally {
      setExportLoading(false);
    }
  };

  // Unique students (de-duplicated by roll_no) for stats
  const uniqueStudents = (() => {
    if (!preRegData?.students) return { registered: 0, notRegistered: 0 };
    const seen = new Set();
    let registered = 0, notRegistered = 0;
    for (const row of preRegData.students) {
      if (!seen.has(row.roll_no)) {
        seen.add(row.roll_no);
        if (row.status === "Registered") registered++;
        else notRegistered++;
      }
    }
    return { registered, notRegistered };
  })();

  // Filtered + sorted rows for the inline table
  const filteredPreRegRows = (() => {
    if (!preRegData?.students) return [];
    const q = preRegSearch.trim().toLowerCase();
    const filtered = preRegData.students.filter(row => {
      if (preRegStatusFilter === "Registered" && row.status !== "Registered") return false;
      if (preRegStatusFilter === "Not Registered" && row.status !== "Not Registered") return false;
      if (!q) return true;
      return (
        row.roll_no?.toLowerCase().includes(q) ||
        row.name?.toLowerCase().includes(q) ||
        row.department?.toLowerCase().includes(q) ||
        row.status?.toLowerCase().includes(q) ||
        row.course_slot?.toLowerCase().includes(q) ||
        row.choices?.some(c => c?.toLowerCase().includes(q))
      );
    });
    // Always sort by roll_no ascending
    return filtered.slice().sort((a, b) =>
      (a.roll_no || "").localeCompare(b.roll_no || "", undefined, { numeric: true, sensitivity: "base" })
    );
  })();

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
            <Select
              label="Programme Type"
              placeholder="All Programmes"
              data={PROGRAMME_TYPE_CHOICES}
              value={programmeType}
              onChange={setProgrammeType}
            />
          </Group>
{/* 
          <Select
            label="List Type (Optional)"
            placeholder="Leave empty for all enrolled students"
            data={LIST_TYPE_CHOICES}
            value={listType}
            onChange={setListType}
            clearable
            mb="xs"
          />
          <Text size="xs" color="dimmed" mb="md">
            💡 If no list type is selected, the system will generate a complete roll list of all students enrolled in the course (Regular, Backlog, Improvement, etc.)
          </Text> */}

          {error ? (
            <Alert color="red">{error}</Alert>
          ) : (
            <Select
              label="Course"
              placeholder="Select course (leave empty to export all)"
              data={courseOptions}
              value={course}
              onChange={setCourse}
              searchable
              clearable
              mb="md"
            />
          )}

          {/* Export All — shown only when courses are loaded and none is selected */}
          {!course && courseOptions.length > 0 && academicYear && semesterType && (
            <Button
              fullWidth
              color="teal"
              mb="sm"
              loading={exportAllLoading}
              onClick={handleExportAllZip}
            >
              Export All ({courseOptions.length} courses) as ZIP
            </Button>
          )}

          <Button
            fullWidth
            onClick={handleGenerateList}
            loading={loading || previewLoading}
            disabled={!academicYear || !semesterType || !course}
          >
            Preview {programmeType !== 'All' ? `${programmeType} ` : ''}{listType || 'All'} Students
          </Button>
        </Tabs.Panel>

        {/* Pre-Registration Tab */}
        <Tabs.Panel value="preregistration" pt="md">
          <Text size="lg" weight={700} align="center" mb="md" color="blue">
            Pre-Registration Report
          </Text>

          <Group grow mb="md">
            <TextInput
              label="Semester"
              placeholder="e.g. 7"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            />
            <Select
              label="Batch"
              placeholder="Select Batch"
              data={batchOptions}
              value={batch}
              onChange={v => { setBatch(v); setPreRegData(null); setPreRegError(null); }}
              searchable
            />
          </Group>

          <Button
            fullWidth
            onClick={fetchPreRegistrationReport}
            loading={preRegLoading}
            disabled={!semester || !batch}
          >
            Generate Pre-Registration Report
          </Button>

          {preRegError && (
            <Alert color="red" mt="md" withCloseButton onClose={() => setPreRegError(null)}>
              {preRegError}
            </Alert>
          )}

          {preRegData && (
            <Paper withBorder p="md" mt="md">
              <Stack spacing="md">

                {/* Report title */}
                <Title order={5} align="center" color="blue">
                  {preRegData.title}
                </Title>

                {/* Stats row */}
                <Group position="center" spacing="xl">
                  <Group spacing="xs">
                    <Badge size="lg" color="green" variant="filled" radius="sm">
                      Registered
                    </Badge>
                    <Text size="xl" weight={700} color="green">
                      {uniqueStudents.registered}
                    </Text>
                    <Text size="sm" color="dimmed">students</Text>
                  </Group>
                  <Group spacing="xs">
                    <Badge size="lg" color="red" variant="filled" radius="sm">
                      Not Registered
                    </Badge>
                    <Text size="xl" weight={700} color="red">
                      {uniqueStudents.notRegistered}
                    </Text>
                    <Text size="sm" color="dimmed">students</Text>
                  </Group>
                  <Group spacing="xs">
                    <Badge size="lg" color="blue" variant="light" radius="sm">
                      Total
                    </Badge>
                    <Text size="xl" weight={700}>
                      {uniqueStudents.registered + uniqueStudents.notRegistered}
                    </Text>
                    <Text size="sm" color="dimmed">students</Text>
                  </Group>
                </Group>

                {/* Filter + Search + Export bar */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "10px",
                  padding: "10px 14px",
                }}>
                  {/* Pill filter buttons */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {[
                      { value: "All",            label: "All",            activeColor: "#228be6", activeBg: "#e7f5ff" },
                      { value: "Registered",     label: "Registered",     activeColor: "#2f9e44", activeBg: "#ebfbee" },
                      { value: "Not Registered", label: "Not Registered", activeColor: "#c92a2a", activeBg: "#fff5f5" },
                    ].map(({ value, label, activeColor, activeBg }) => {
                      const active = preRegStatusFilter === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setPreRegStatusFilter(value)}
                          style={{
                            padding: "6px 16px",
                            borderRadius: "20px",
                            border: `1.5px solid ${active ? activeColor : "#dee2e6"}`,
                            background: active ? activeBg : "#fff",
                            color: active ? activeColor : "#495057",
                            fontWeight: active ? 700 : 500,
                            fontSize: "13px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            outline: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div style={{ width: "1px", height: "28px", background: "#dee2e6", flexShrink: 0 }} />

                  {/* Search */}
                  <TextInput
                    placeholder="Search by roll no, name, department, slot, course…"
                    value={preRegSearch}
                    onChange={e => setPreRegSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 0 }}
                    styles={{
                      input: {
                        fontSize: "13px",
                        background: "#fff",
                        border: "1.5px solid #ced4da",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        height: "36px",
                        "&:focus": { borderColor: "#228be6" },
                      },
                    }}
                  />

                  {/* Row count */}
                  <Text size="xs" color="dimmed" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                    {filteredPreRegRows.length} rows
                  </Text>

                  {/* Divider */}
                  <div style={{ width: "1px", height: "28px", background: "#dee2e6", flexShrink: 0 }} />

                  {/* Export */}
                  <Button
                    leftIcon={<span style={{ fontSize: 13 }}>↓</span>}
                    onClick={exportPreRegistrationReport}
                    loading={exportLoading}
                    variant="filled"
                    color="green"
                    size="sm"
                    style={{ flexShrink: 0, borderRadius: "8px" }}
                  >
                    Export XLSX
                  </Button>
                </div>

                {/* Inline data table — fixed height box, scrolls both X and Y internally */}
                <ScrollArea
                  style={{ height: 460 }}
                  type="scroll"
                  offsetScrollbars
                >
                  <div style={{ minWidth: "max-content" }}>
                    <Table
                      striped
                      highlightOnHover
                      fontSize="xs"
                      style={{ border: "1px solid #dee2e6", tableLayout: "auto", width: "100%" }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#e7f5ff" }}>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>#</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>Roll No</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>Name</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>Department</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>Status</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>Timestamp</th>
                          <th style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}>Course Slot</th>
                          {Array.from({ length: preRegData.max_choices }, (_, i) => (
                            <th
                              key={i}
                              style={{ padding: "10px 10px", whiteSpace: "nowrap", position: "sticky", top: 0, backgroundColor: "#e7f5ff", zIndex: 2 }}
                            >
                              Choice {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPreRegRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7 + preRegData.max_choices}
                              style={{ textAlign: "center", padding: "2rem", color: "#868e96" }}
                            >
                              No records match your filter / search.
                            </td>
                          </tr>
                        ) : (
                          filteredPreRegRows.map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: "6px 10px" }}>{idx + 1}</td>
                              <td style={{ padding: "6px 10px", fontWeight: 500, whiteSpace: "nowrap" }}>{row.roll_no || "—"}</td>
                              <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{row.name || "—"}</td>
                              <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{row.department || "—"}</td>
                              <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                                <span style={{
                                  color: row.status === "Registered" ? "#2f9e44" : "#c92a2a",
                                  fontWeight: 600,
                                }}>
                                  {row.status || "—"}
                                </span>
                              </td>
                              <td style={{ padding: "6px 10px", color: "#868e96", whiteSpace: "nowrap" }}>{row.timestamp || "—"}</td>
                              <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{row.course_slot || "—"}</td>
                              {Array.from({ length: preRegData.max_choices }, (_, i) => (
                                <td key={i} style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                                  {row.choices?.[i] || "—"}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                </ScrollArea>

              </Stack>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Preview Modal for All List Types */}
      <Modal
        opened={showPreview}
        onClose={() => setShowPreview(false)}
        title={
          <Text size="lg" weight={700} style={{ color: "#1c7ed6" }}>
            {programmeType !== 'All' ? `${programmeType} ` : ''}{listType || 'All Registration Types'} Student List Preview
          </Text>
        }
        size="xl"
        padding="lg"
        centered
      >
        <Paper withBorder p="md" style={{ backgroundColor: "#f8f9fa" }}>
          <Stack spacing="md">
            {/* Course Header Information */}
            <Box style={{ borderBottom: "1px solid #dee2e6", paddingBottom: "10px" }}>
              <Text align="center" size="lg" weight={700} style={{ color: "#1c7ed6" }}>
                PDPM INDIAN INSTITUTE OF INFORMATION TECHNOLOGY, DESIGN AND MANUFACTURING JABALPUR
              </Text>
              <Text align="center" size="md" weight={600} mt="xs">
                {semesterType.toUpperCase()}, {academicYear}
              </Text>
            </Box>

            {/* Course Details */}
            <Box>
              <Text size="sm" weight={500}>Course No.: <Text span>{courseOptions.find(c => c.value === course)?.label?.split(' - ')[0] || 'N/A'}</Text></Text>
              <Text size="sm" weight={500}>Course Title: <Text span>{courseOptions.find(c => c.value === course)?.label?.split(' - ')[1] || courseOptions.find(c => c.value === course)?.label || 'N/A'}</Text></Text>
              <Text size="sm" weight={500}>Instructor: <Text span>{
                courseOptions.find(c => c.value === course)?.instructor || 'TBA'
              }</Text></Text>
              <Text size="sm" weight={500}>List Type: <Text span color={listType ? "blue" : "green"}>
                {programmeType !== 'All' ? `${programmeType} - ` : ""}{listType || "Complete Roll List (All Registration Types)"}
              </Text></Text>
            </Box>

            {previewLoading ? (
              <Box style={{ textAlign: "center", padding: "2rem" }}>
                <Loader size="lg" />
                <Text mt="md">Loading preview data...</Text>
              </Box>
            ) : previewData.length > 0 ? (
              <ScrollArea style={{ height: "400px" }}>
                <Table striped highlightOnHover style={{ border: "1px solid #dee2e6" }}>
                  <thead style={{ backgroundColor: "#e7f5ff" }}>
                    <tr>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>S. No</th>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>Roll No</th>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>Name</th>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>Discipline</th>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>Email</th>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>Reg. Type</th>
                      <th style={{ padding: "12px 8px", fontSize: "13px", fontWeight: "600" }}>Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((student, index) => (
                      <tr key={student.roll_number || index}>
                        <td style={{ padding: "8px", fontSize: "12px" }}>{index + 1}</td>
                        <td style={{ padding: "8px", fontSize: "12px", fontWeight: "500" }}>
                          {student.roll_number || student.roll_no || student.id || 'N/A'}
                        </td>
                        <td style={{ padding: "8px", fontSize: "12px" }}>
                          {student.name || student.full_name || student.student_name || 'N/A'}
                        </td>
                        <td style={{ padding: "8px", fontSize: "12px" }}>
                          {student.branch || student.discipline || student.department || 'N/A'}
                        </td>
                        <td style={{ padding: "8px", fontSize: "12px" }}>
                          {student.email || 'N/A'}
                        </td>
                        <td style={{ padding: "8px", fontSize: "12px" }}>
                          {student.registration_type || student.status || listType || 'Regular'}
                        </td>
                        <td style={{ padding: "8px", fontSize: "12px" }}>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Alert color="blue">
                {programmeType !== 'All' 
                  ? `No ${programmeType} students found${listType ? ` with "${listType}" registration type` : ''} in this course.`
                  : listType 
                    ? `No students found with "${listType}" registration type in this course.`
                    : 'No students enrolled in this course (checked all registration types: Regular, Backlog, Improvement, etc.).'
                }
              </Alert>
            )}

            <Group position="right" mt="lg">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmGenerate}
                loading={loading}
                disabled={previewData.length === 0}
                style={{ backgroundColor: "#1c7ed6" }}
              >
                Generate Excel File
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Modal>
    </Card>
  );
}

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Card,
  Text,
  Button,
  Alert,
  Loader,
  Center,
  Group,
  Select,
  TextInput,
} from "@mantine/core";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { showNotification } from "@mantine/notifications";
import FusionTable from "../../components/FusionTable";
import {
  generatexlsheet,
  academicProceduresFaculty,
} from "../../routes/academicRoutes";

const PROGRAMME_TYPE_CHOICES = [
  { value: "All", label: "All Programmes" },
  { value: "UG", label: "Undergraduate (UG)" },
  { value: "PG", label: "Postgraduate (PG)" },
];

const SEMESTER_TYPE_CHOICES = [
  { value: "All", label: "All Semesters" },
  { value: "Odd Semester", label: "Odd Semester" },
  { value: "Even Semester", label: "Even Semester" },
  { value: "Summer Semester", label: "Summer Semester" },
];

const SEM_ORDER = { "Odd Semester": 0, "Even Semester": 1, "Summer Semester": 2 };

function getCurrentDefaults() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  if (month >= 7) {
    return {
      academicYear: `${year}-${String(year + 1).slice(-2)}`,
      semesterType: "Odd Semester",
    };
  }
  return {
    academicYear: `${year - 1}-${String(year).slice(-2)}`,
    semesterType: "Even Semester",
  };
}

function sortCourses(courses) {
  return [...courses].sort((a, b) => {
    if ((a.academic_year || "") !== (b.academic_year || ""))
      return (a.academic_year || "").localeCompare(b.academic_year || "");
    const semA = SEM_ORDER[a.semester_type] ?? 9;
    const semB = SEM_ORDER[b.semester_type] ?? 9;
    if (semA !== semB) return semA - semB;
    return (a.course_name || "").localeCompare(b.course_name || "");
  });
}

const { academicYear: DEFAULT_AY, semesterType: DEFAULT_SEM } = getCurrentDefaults();

function ViewRollList() {
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]); // after programme type filter
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingCourseId, setDownloadingCourseId] = useState(null);
  const [filteringCourses, setFilteringCourses] = useState(false);

  const [programmeType, setProgrammeType] = useState("All");
  const [selectedAY, setSelectedAY] = useState(DEFAULT_AY);
  const [selectedSem, setSelectedSem] = useState(DEFAULT_SEM);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) { setFetchError("No authentication token found."); return; }
      try {
        const response = await axios.get(academicProceduresFaculty, {
          headers: { Authorization: `Token ${token}` },
        });
        const assignedCourses = response.data.assigned_courses || [];
        setAllCourses(assignedCourses);
        setFilteredCourses(assignedCourses);
      } catch (error) {
        setFetchError(error.response?.data?.error || "Failed to fetch courses.");
      }
    };
    fetchCourses();
  }, []);

  const filterCoursesByProgrammeType = async (progType, courses) => {
    if (progType === "All") { setFilteredCourses(courses); return; }
    setFilteringCourses(true);
    const token = localStorage.getItem("authToken");
    const result = [];
    for (const course of courses) {
      try {
        const response = await axios.post(
          generatexlsheet,
          { course: course.course_id, semester_type: course.semester_type, academic_year: course.academic_year, programme_type: progType, preview_only: true },
          { headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" } }
        );
        const students = response.data.students || response.data || [];
        if (students.length > 0) result.push(course);
      } catch {
        result.push(course);
      }
    }
    setFilteredCourses(result);
    setFilteringCourses(false);
  };

  useEffect(() => {
    if (allCourses.length > 0) filterCoursesByProgrammeType(programmeType, allCourses);
  }, [allCourses]);

  const handleProgrammeTypeChange = async (val) => {
    setProgrammeType(val);
    setSearchQuery("");
    await filterCoursesByProgrammeType(val, allCourses);
  };

  // Academic year options derived from filteredCourses + always include default (current) AY
  const ayOptions = useMemo(() => {
    const years = new Set(filteredCourses.map((c) => c.academic_year).filter(Boolean));
    years.add(DEFAULT_AY);
    const sorted = [...years].sort((a, b) => b.localeCompare(a));
    return [{ value: "All", label: "All Years" }, ...sorted.map((y) => ({ value: y, label: y }))];
  }, [filteredCourses]);

  const handleDownloadRollList = async (courseId, courseCode, semesterType, academicYear) => {
    const token = localStorage.getItem("authToken");
    if (!token) { setFetchError("No authentication token found."); return; }
    try {
      setDownloadingCourseId(courseId);
      setLoading(true);
      const payload = { course: courseId, semester_type: semesterType, academic_year: academicYear };
      if (programmeType !== "All") payload.programme_type = programmeType;
      const response = await axios.post(generatexlsheet, payload, {
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${courseCode}${programmeType !== "All" ? `_${programmeType}` : ""}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification({ title: "Success", message: `Roll list downloaded successfully`, color: "green" });
    } catch (error) {
      showNotification({ title: "Download Failed", message: error.response?.data?.error || "Failed to download roll list.", color: "red" });
    } finally {
      setLoading(false);
      setDownloadingCourseId(null);
    }
  };

  const q = searchQuery.trim().toLowerCase();

  const displayCourses = sortCourses(
    filteredCourses.filter((c) => {
      if (selectedAY !== "All" && c.academic_year !== selectedAY) return false;
      if (selectedSem !== "All" && c.semester_type !== selectedSem) return false;
      if (q) {
        return (
          (c.course_name || "").toLowerCase().includes(q) ||
          (c.course_code || "").toLowerCase().includes(q) ||
          String(c.version || "").toLowerCase().includes(q) ||
          (c.academic_year || "").toLowerCase().includes(q) ||
          (c.semester_type || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
  );

  const columnNames = ["Course Name", "Course Code", "Version", "Academic Year", "Semester Type", "Action"];

  const elements = displayCourses.map((course) => ({
    "Course Name": course.course_name,
    "Course Code": course.course_code,
    Version: course.version,
    "Academic Year": course.academic_year,
    "Semester Type": course.semester_type,
    Action: (
      <Button
        onClick={() => handleDownloadRollList(course.course_id, course.course_code, course.semester_type, course.academic_year)}
        variant="outline"
        color="blue"
        size="xs"
        disabled={loading && downloadingCourseId === course.course_id}
        rightSection={loading && downloadingCourseId === course.course_id ? <Loader size="xs" color="blue" /> : null}
      >
        {loading && downloadingCourseId === course.course_id ? "Downloading..." : `Download ${programmeType !== "All" ? programmeType + " " : ""}Roll List`}
      </Button>
    ),
  }));

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Text size="lg" weight={700} mb="md" style={{ textAlign: "center", color: "#3B82F6" }}>
        Assigned Courses
      </Text>

      <Group mb="md" align="flex-end" wrap="wrap">
        <Select
          label="Programme Type"
          data={PROGRAMME_TYPE_CHOICES}
          value={programmeType}
          onChange={handleProgrammeTypeChange}
          style={{ width: 180 }}
          disabled={filteringCourses}
        />
        <Select
          label="Academic Year"
          data={ayOptions}
          value={selectedAY}
          onChange={setSelectedAY}
          style={{ width: 150 }}
          disabled={filteringCourses}
        />
        <Select
          label="Semester Type"
          data={SEMESTER_TYPE_CHOICES}
          value={selectedSem}
          onChange={setSelectedSem}
          style={{ width: 180 }}
        />
        <TextInput
          label="Search"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<MagnifyingGlass size={16} />}
          style={{ flex: 1, minWidth: 180 }}
        />
        {filteringCourses && (
          <Text size="sm" color="dimmed" style={{ alignSelf: "center", marginTop: 20 }}>
            Filtering...
          </Text>
        )}
      </Group>

      {fetchError && (
        <Alert title="Error" color="red" mb="md">
          {fetchError}
        </Alert>
      )}

      {loading && allCourses.length === 0 ? (
        <Center><Loader size="lg" /></Center>
      ) : displayCourses.length === 0 && allCourses.length > 0 && !filteringCourses ? (
        <Alert color="blue" mb="md">
          {q ? "No courses match your search." : "No courses found for the selected filters."}
        </Alert>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <FusionTable columnNames={columnNames} elements={elements} width="100%" />
        </div>
      )}
    </Card>
  );
}

export default ViewRollList;

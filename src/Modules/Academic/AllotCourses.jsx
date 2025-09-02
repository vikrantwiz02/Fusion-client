import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Button,
  LoadingOverlay,
  Select,
  Stack,
  FileButton,
  Divider,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconUpload, IconDownload } from "@tabler/icons-react";
import axios from "axios";
import * as XLSX from "xlsx";
import { allotCoursesRoute, batchesRoute } from "../../routes/academicRoutes";

export default function AllotCourses() {
  const [programmeOptions, setProgrammeOptions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [programme, setProgramme] = useState(null); // Changed to null
  const [semesterValue, setSemesterValue] = useState(null); // Changed to null
  const [semester, setSemester] = useState("");
  const [semesterType, setSemesterType] = useState("");
  const [academicYear, setAcademicYear] = useState(null); // Changed to null
  const [academicYearOptions, setAcademicYearOptions] = useState([]);

  const semesterOptions = [
    { value: JSON.stringify({ no: 1, type: "Odd Semester" }), label: "Semester 1 (Odd)" },
    { value: JSON.stringify({ no: 2, type: "Even Semester" }), label: "Semester 2 (Even)" },
    { value: JSON.stringify({ no: 2, type: "Summer Semester" }), label: "Summer Term 1" },
    { value: JSON.stringify({ no: 3, type: "Odd Semester" }), label: "Semester 3 (Odd)" },
    { value: JSON.stringify({ no: 4, type: "Even Semester" }), label: "Semester 4 (Even)" },
    { value: JSON.stringify({ no: 4, type: "Summer Semester" }), label: "Summer Term 2" },
    { value: JSON.stringify({ no: 5, type: "Odd Semester" }), label: "Semester 5 (Odd)" },
    { value: JSON.stringify({ no: 6, type: "Even Semester" }), label: "Semester 6 (Even)" },
    { value: JSON.stringify({ no: 6, type: "Summer Semester" }), label: "Summer Term 3" },
    { value: JSON.stringify({ no: 7, type: "Odd Semester" }), label: "Semester 7 (Odd)" },
    { value: JSON.stringify({ no: 8, type: "Even Semester" }), label: "Semester 8 (Even)" },
    { value: JSON.stringify({ no: 8, type: "Summer Semester" }), label: "Summer Term 4" },
  ];

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const start = y - 3;
    const yrs = [];
    for (let i = 0; i <= 6; i++) {
      const y1 = start + i;
      const y2 = y1 + 1;
      yrs.push({ value: `${y1}-${String(y2).slice(-2)}`, label: `${y1}-${String(y2).slice(-2)}` });
    }
    setAcademicYearOptions(yrs);
  }, []);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      showNotification({ title: "Error", message: "No auth token", color: "red" });
      setLoading(false);
      return;
    }
    axios
      .get(batchesRoute, { headers: { Authorization: `Token ${token}` } })
      .then((res) => {
        if (res.data && res.data.batches && Array.isArray(res.data.batches)) {
          // Filter out invalid batches and create unique options
          const validBatches = res.data.batches.filter(bat => 
            bat.batch_id && bat.name && bat.discipline && bat.year
          );
          
          const uniqueOptions = validBatches.map((bat) => ({
            value: String(bat.batch_id),
            label: `${bat.name} ${bat.discipline} ${bat.year}`
          }));
          
          // Remove any potential duplicates by value
          const seenValues = new Set();
          const deduplicatedOptions = uniqueOptions.filter(option => {
            if (seenValues.has(option.value)) {
              return false;
            }
            seenValues.add(option.value);
            return true;
          });
          
          setProgrammeOptions(deduplicatedOptions);
        } else {
          console.error("Invalid batches data received:", res.data);
          showNotification({ title: "Error", message: "Invalid data format received", color: "red" });
        }
      })
      .catch((err) => showNotification({ title: "Error fetching batches", message: err.message, color: "red" }))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setProgramme(null);
    setSemesterValue(null);
    setSemester("");
    setSemesterType("");
    setAcademicYear(null);
    setSelectedFile(null);
    setFileKey((f) => f + 1);
  };

  const downloadTemplate = () => {
    const rows = [
      { RollNo: "220101001", CourseSlot: "Slot A", CourseCode: "CSE101", CourseName: "Data Structures" },
      { RollNo: "220101002", CourseSlot: "Slot B", CourseCode: "CSE102", CourseName: "Algorithms" },
    ];
    const ws = XLSX.utils.json_to_sheet(rows, { header: ["RollNo", "CourseSlot", "CourseCode", "CourseName"] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "allotment_template.xls", { bookType: "xls" });
  };

  const isFormValid = Boolean(selectedFile && programme && semester && semesterType && academicYear);

  const handleUpload = () => {
    if (!isFormValid) {
      showNotification({ title: "Incomplete", message: "Please fill all fields and select a file", color: "yellow" });
      return;
    }
    setIsUploading(true);
    setLoading(true);
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("allotedCourses", selectedFile);
    formData.append("batch", programme);
    formData.append("semester", semester);
    formData.append("semester_type", semesterType);
    formData.append("academic_year", academicYear);

    axios
      .post(allotCoursesRoute, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Token ${token}` },
      })
      .then(() => {
        showNotification({ title: "Success", message: "Courses allotted successfully", color: "green" });
        resetForm();
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message;
        showNotification({ title: "Error", message: msg || "Upload failed", color: "red" });
        setSelectedFile(null);
        setFileKey((f) => f + 1);
      })
      .finally(() => {
        setIsUploading(false);
        setLoading(false);
      });
  };

  const handleSemesterChange = (value) => {
    setSemesterValue(value || null);
    if (value) {
      try {
        const { no, type } = JSON.parse(value);
        setSemester(String(no));
        setSemesterType(type);
      } catch (error) {
        console.error("Error parsing semester value:", error);
        setSemester("");
        setSemesterType("");
      }
    } else {
      setSemester("");
      setSemesterType("");
    }
  };

  return (
    <Card>
      <LoadingOverlay visible={loading} />
      <Text size="2xl" weight={700} align="center" mb="md">
        Allot Student Courses
      </Text>
      <Button leftSection={<IconDownload />} variant="light" onClick={downloadTemplate} mb="md">
        Download Template
      </Button>
      <Text size="sm" color="dimmed" mb="sm">
        Format: RollNo | CourseSlot | CourseCode | CourseName
      </Text>
      <Divider mb="lg" />
      <Stack spacing="md" mb="lg">
        <Select
          clearable
          label="Programme"
          placeholder="Select batch"
          data={programmeOptions}
          value={programme}
          onChange={setProgramme}
          searchable
        />
        <Select
          clearable
          label="Semester"
          placeholder="Select semester"
          data={semesterOptions}
          value={semesterValue}
          onChange={handleSemesterChange}
          searchable
        />
        <Select
          clearable
          label="Academic Year"
          placeholder="Select year"
          data={academicYearOptions}
          value={academicYear}
          onChange={setAcademicYear}
        />
      </Stack>
      <FileButton key={fileKey} onChange={setSelectedFile} accept=".xlsx,.xls">
        {(props) => (
          <Button {...props} leftSection={<IconUpload />} variant="outline" fullWidth mb="md">
            {selectedFile ? selectedFile.name : "Choose Excel file"}
          </Button>
        )}
      </FileButton>
      <Button
        fullWidth
        size="md"
        leftSection={<IconUpload />}
        loading={isUploading}
        onClick={handleUpload}
        disabled={!isFormValid || isUploading}
      >
        {isUploading ? "Uploading..." : "Upload & Allot"}
      </Button>
    </Card>
  );
}
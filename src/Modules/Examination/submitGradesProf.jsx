import React, { useState, useEffect, useRef } from "react";
import {
  Select, Button, FileInput, Grid, Card, Box,
  LoadingOverlay, Alert, Text, Group, List, Title, Table
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import {
  get_course_reg_academic_years,
  submitGradesProf,
  download_template,
  preview_grades,
  upload_grades_prof,
} from "./routes/examinationRoutes";
import { FileArrowDown, Upload } from "@phosphor-icons/react";
import { useSelector } from "react-redux";

export default function SubmitGradesProf() {
  
  const semesterTypes = [
    { value: "Odd Semester", label: "Odd Semester" },
    { value: "Even Semester", label: "Even Semester" },
    { value: "Summer Semester", label: "Summer Semester" },
  ];
  const programmeTypes = [
    { value: "UG", label: "UG (Undergraduate)" },
    { value: "PG", label: "PG (Postgraduate)" },
    { value: "All", label: "All Programmes" },
  ];
  const userRole = useSelector((s) => s.user.role);

  const [year, setYear] = useState("");
  const [academicYears, setAcademicYears] = useState([]); 
  const [semesterType, setSemesterType] = useState("");
  const [programmeType, setProgrammeType] = useState("");
  const [course, setCourse] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [allCourseOptions, setAllCourseOptions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  // error & success states
  const [error, setError] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [success, setSuccess] = useState("");

  const previewRef = useRef();

  useEffect(() => {
    async function fetchAcademicYears() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await axios.get(
          get_course_reg_academic_years,
          { headers: { Authorization: `Token ${token}` } }
        );
        setAcademicYears(data.academic_years.map((y) => ({ value: y, label: y })));
      } catch {
        setError("Failed to load academic years.");
      } finally {
        setLoading(false);
      }
    }
    fetchAcademicYears();
  }, []);

  // Fetch available courses
  useEffect(() => {
    if (!year || !semesterType) return;
    setLoading(true);
    setError(""); setErrorList("");
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await axios.post(
          submitGradesProf,
          { Role: userRole, academic_year: year, semester_type: semesterType },
          { headers: { Authorization: `Token ${token}` } }
        );
        setCourse(null);
        const courses = data.courses_info.map((c) => ({
          value: c.id.toString(),
          label: `${c.code} - ${c.name}`,
        }));
        setAllCourseOptions(courses);
        setCourseOptions(courses);
      } catch (err) {
        setError(`Error fetching courses: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [year, semesterType, userRole]);

  useEffect(() => {
    if (!programmeType || programmeType === 'All') {
      setCourseOptions(allCourseOptions);
      setCourse(null);
      return;
    }

    const filterCoursesWithStudents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const filteredCourses = [];

        for (const courseOption of allCourseOptions) {
          try {
            const payload = { 
              Role: userRole, 
              course: courseOption.value, 
              year: year, 
              semester_type: semesterType 
            };
            
            if (programmeType && programmeType !== 'All') {
              payload.programme_type = programmeType;
            }
            
            const response = await axios.post(
              download_template,
              payload,
              { headers: { Authorization: `Token ${token}` }, responseType: "text" }
            );
            
            const csvText = response.data;
            const lines = csvText.split('\n').filter(line => line.trim());

            if (lines.length > 1) {
              filteredCourses.push(courseOption);
            }
          } catch (err) {
            // If error or no students, skip this course
          }
        }
        
        setCourseOptions(filteredCourses);
        setCourse(null);
      } catch (err) {
        setError(`Error filtering courses: ${err.message}`);
        setCourseOptions(allCourseOptions);
      } finally {
        setLoading(false);
      }
    };

    filterCoursesWithStudents();
  }, [programmeType, allCourseOptions, userRole, year, semesterType]);

  const handleFileChange = (file) => setExcelFile(file);

  const handleTemplateDownload = async () => {
    if (!year || !semesterType || !course) {
      setError("Please select academic year, semester type, and course.");
      return;
    }
    
    setLoading(true);
    setError(""); setErrorList([]);
    
    try {
      const token = localStorage.getItem("authToken");
      const payload = { Role: userRole, course: course, year: year, semester_type: semesterType };

      if (programmeType && programmeType !== '' && programmeType !== 'All') {
        payload.programme_type = programmeType;
      }
      
      const resp = await axios.post(
        download_template,
        payload,
        { headers: { Authorization: `Token ${token}` }, responseType: "blob" }
      );
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${course}_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotification({
        title: "Downloaded",
        message: "Template downloaded successfully.",
        color: "green",
      });
    } catch (err) {
      setError(`Error downloading template: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!year || !semesterType || !course || !excelFile) {
      setError("Please fill all fields and upload a CSV file to preview.");
      return;
    }
    setLoading(true);
    setError(""); setErrorList([]);
    try {
      const token = localStorage.getItem("authToken");
      const form = new FormData();
      form.append("Role", userRole);
      form.append("course_id", course);
      form.append("academic_year", year);
      form.append("semester_type", semesterType);
      form.append("csv_file", excelFile);
      form.append("reSubmit", "false");  // always false

      if (programmeType && programmeType !== '' && programmeType !== 'All') {
        form.append("programme_type", programmeType);
      }

      const { data } = await axios.post(preview_grades, form, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setPreviewData(data.preview);
      setShowPreview(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      const parts = msg.split("\n").map((s) => s.trim()).filter((s) => s);
      if (parts.length > 1) setErrorList(parts);
      else                   setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrades = async () => {
    setLoading(true);
    setError(""); setErrorList([]); setSuccess("");
    try {
      const token = localStorage.getItem("authToken");
      const form = new FormData();
      form.append("Role", userRole);
      form.append("course_id", course);
      form.append("academic_year", year);
      form.append("semester_type", semesterType);
      form.append("csv_file", excelFile);
      form.append("reSubmit", "false");  // always false

      await axios.post(upload_grades_prof, form, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      showNotification({ title: "Success", message: "Grades submitted!", color: "green" });
      setSuccess("Grades uploaded successfully.");
      setShowPreview(false);
      setExcelFile(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      const parts = msg.split("\n").map((s) => s.trim()).filter((s) => s);
      if (parts.length > 1) setErrorList(parts);
      else                   setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData([]);
    setExcelFile(null);
    setError(""); setErrorList([]);
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Title order={2} mb="md">Submit Course Grades</Title>

      {error && <Alert color="red" mb="md">{error}</Alert>}
      {errorList.length > 0 && (
        <Alert color="red" mb="md">
          <Text weight={500}>The following errors occurred:</Text>
          <List withPadding>
            {errorList.map((e,i) => <List.Item key={i}>{e.replace(/^[-\s]+/,"")}</List.Item>)}
          </List>
        </Alert>
      )}
      {success && (
        <Alert color="green" mb="md" withCloseButton onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {!showPreview ? (
        <>
          <Grid>
            <Grid.Col xs={12} sm={6}>
              <Select
                label="Academic Year"
                placeholder="Select Year"
                data={academicYears}
                value={year}
                onChange={setYear}
                disabled={loading}
                required
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6}>
              <Select
                label="Semester Type"
                placeholder="Select Semester"
                data={semesterTypes}
                value={semesterType}
                onChange={setSemesterType}
                disabled={loading}
                required
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6}>
              <Select
                label="Programme Type"
                placeholder="Select Programme Type"
                data={programmeTypes}
                value={programmeType}
                onChange={setProgrammeType}
                disabled={loading}
                clearable
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6}>
              <Select
                label="Course"
                placeholder={loading ? "Loading courses..." : "Select Course"}
                data={courseOptions}
                value={course}
                onChange={setCourse}
                disabled={!year || !semesterType || loading}
                required
                searchable
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6}>
              <FileInput
                label="Upload CSV File"
                placeholder="Click to select CSV"
                onChange={handleFileChange}
                value={excelFile}
                accept=".csv"
                clearable
                disabled={loading}
              />
            </Grid.Col>
          </Grid>

          <Box mt="xl">
            <Text size="sm" mb="xs" weight={500}>
              CSV File Format Requirements:
            </Text>
            <List size="sm" spacing="xs" withPadding>
              <List.Item>Required: <b>roll_no</b>, <b>grade</b>, <b>remarks</b></List.Item>
              <List.Item>Optional: <b>semester</b> (auto‑filled if missing)</List.Item>
              <List.Item>Ensure valid roll numbers and grades</List.Item>
            </List>
          </Box>

          <Group mt="xl" position="apart">
            <Button
              leftIcon={<FileArrowDown />}
              color="green"
              onClick={handleTemplateDownload}
              loading={loading}
              disabled={!year || !semesterType || !course || loading}
            >
              Download Template
            </Button>

            <Button
              leftIcon={<Upload />}
              color="blue"
              onClick={handlePreview}
              loading={loading}
              disabled={!year || !semesterType || !course || !excelFile || loading}
            >
              Preview
            </Button>
          </Group>
        </>
      ) : (
        <Box ref={previewRef} mt="md">
          <Title order={3} mb="sm">Grades Preview</Title>
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>S.no.</th>
                <th>Roll No</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Remarks</th>
                <th>Semester</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((r, i) => (
                <tr key={i} style={{ backgroundColor: r.is_registered ? undefined : "#ffe6e6" }}>
                  <td>{i+1}</td>
                  <td>{r.roll_no}</td>
                  <td>{r.name}</td>
                  <td>{r.grades}</td>
                  <td>{r.remarks}</td>
                  <td>{r.semester}</td>
                  <td style={{ color: r.is_registered ? "green" : "red" }}>
                    {r.is_registered ? "Registered" : "Missing Registration"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Group mt="md" style={{ gap: 12 }}>
            <Button color="blue" onClick={handleSubmitGrades} loading={loading}>
              Submit
            </Button>
            <Button variant="outline" onClick={handleCancelPreview}>
              Cancel
            </Button>
          </Group>
        </Box>
      )}

      <LoadingOverlay visible={loading} overlayBlur={2} />
    </Card>
  );
}

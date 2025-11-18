import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  Button,
  TextInput,
  Grid,
  Paper,
  Card,
  Box,
  LoadingOverlay,
  Alert,
  Table,
} from "@mantine/core";
import axios from "axios";
import {
  get_course_reg_academic_years,
  get_courses,
  download_template,
  preview_grades,
  upload_grades,
} from "./routes/examinationRoutes";
import { FileArrowDown } from "@phosphor-icons/react";
import { useSelector } from "react-redux";
import { showNotification } from "@mantine/notifications";

function SubmitGrades() {
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

  const [year, setYear] = useState("");
  const [semesterType, setSemesterType] = useState("");
  const [programmeType, setProgrammeType] = useState("");
  const [academicYears, setAcademicYears] = useState([]); 
  const [course, setCourse] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [allCourseOptions, setAllCourseOptions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef();
  const userRole = useSelector((state) => state.user.role);

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
        setAcademicYears(data.academic_years.map((y) => ({ value: y.toString(), label: y.toString() })));
      } catch {
        setError("Failed to load academic years.");
      } finally {
        setLoading(false);
      }
    }
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (!year || !semesterType) return;
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No authentication token found!");
        setLoading(false);
        return;
      }
      try {
        const requestData = {
          Role: userRole,
          academic_year: year,
          semester_type: semesterType,
        };
        const { data } = await axios.post(get_courses, requestData, {
          headers: { Authorization: `Token ${token}` },
        });
        const uniqueCourses = Array.from(
          new Map(data.courses.map((c) => [c.id, c])).values()
        );
        const courseList = uniqueCourses.map((c) => ({
          value: c.id.toString(),
          label: `${c.name} (${c.code})`,
        }));
        setCourseId(null);
        setCourse(null);
        setAllCourseOptions(courseList);
        setCourseOptions(courseList);
      } catch (err) {
        setError(`Error fetching courses: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [year, semesterType, userRole]);

  useEffect(() => {
    if (!programmeType || programmeType === 'All') {
      setCourseOptions(allCourseOptions);
      setCourseId(null);
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
        setCourseId(null);
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

  const handleFileChange = (event) => {
    setExcelFile(event.target.files[0]);
  };

  const isFormComplete = () => {
    return course && year && semesterType && excelFile;
  };

  const handleCourseChange = (selectedId) => {
    setCourseId(selectedId);
    setCourse(selectedId);
  };

  const handleTemplateDownload = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No authentication token found!");
      return;
    }
    if (!courseId || !year || !semesterType) {
      setError("Please select a course, academic year and semester type before downloading.");
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        Role: userRole,
        course: courseId,
        year: year,
        semester_type: semesterType,
      };
      if (programmeType && programmeType !== '' && programmeType !== 'All') {
        requestData.programme_type = programmeType;
      }
      
      const response = await axios.post(download_template, requestData, {
        headers: { Authorization: `Token ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `template_${courseId}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setError(null);
    } catch (error) {
      setError(`Error downloading CSV template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!isFormComplete()) {
      setError("Please fill the entire form and upload a CSV file to preview.");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No authentication token found!");
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("Role", userRole);
      formData.append("course_id", courseId);
      formData.append("academic_year", year);
      formData.append("semester_type", semesterType);
      formData.append("csv_file", excelFile);

      if (programmeType && programmeType !== '' && programmeType !== 'All') {
        formData.append("programme_type", programmeType);
      }
      
      const response = await axios.post(preview_grades, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setPreviewData(response.data.preview);
      setShowPreview(true);
      setError(null);
    } catch (error) {
      setError(`Error previewing grades: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrades = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No authentication token found!");
      return;
    }
    if (!courseId || !year || !semesterType || !excelFile) {
      setError("Please fill out all fields and upload a CSV file.");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("Role", userRole);
      formData.append("course_id", courseId);
      formData.append("academic_year", year);
      formData.append("semester_type", semesterType);
      formData.append("csv_file", excelFile);
      const response = await axios.post(upload_grades, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response&&response.data.message) {
          showNotification({
              title: "Success",
              message: "Grades Submitted successfully.",
              color: "green"
          });
          setShowPreview(false);   
      }
      setError(null);
    } catch (error) {
      setError(`Error submitting grades: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setError(null);
    setPreviewData(null);
    setExcelFile(null);
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Paper p="md">
        <h1>Submit Grades</h1>
        {error && <Alert color="red">{error}</Alert>}
        {!showPreview && (
          <>
            <Grid>
              <Grid.Col xs={12} sm={4}>
                <Select
                  label="Academic Year"
                  placeholder="Select Academic Year"
                  data={academicYears}
                  value={year}
                  onChange={setYear}
                  required
                />
              </Grid.Col>
              <Grid.Col xs={12} sm={4}>
                <Select
                  label="Semester Type"
                  placeholder="Select Semester Type"
                  data={semesterTypes}
                  value={semesterType}
                  onChange={setSemesterType}
                  required
                />
              </Grid.Col>
              <Grid.Col xs={12} sm={4}>
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
                  onChange={handleCourseChange}
                  required
                  searchable
                  disabled={!year || !semesterType || loading}
                />
              </Grid.Col>
              <Grid.Col xs={12} sm={6}>
                <TextInput
                  type="file"
                  label="Upload CSV File"
                  onChange={handleFileChange}
                  accept=".csv"
                  required
                />
              </Grid.Col>
            </Grid>
            <Box mt="md" style={{ display: "flex", gap: "1rem" }}>
              <Button
                size="md"
                radius="sm"
                color="blue"
                disabled={!isFormComplete()}
                loading={loading}
                onClick={handlePreview}
              >
                Preview
              </Button>
              <Button
                size="md"
                radius="sm"
                color="green"
                onClick={handleTemplateDownload}
                loading={loading}
              >
                Download Template
              </Button>
            </Box>
          </>
        )}
        {showPreview && previewData && (
          <Box ref={previewRef} mt="md">
            <h2>Grades Preview</h2>
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Name</th>
                  <th>Grades</th>
                  <th>Remarks</th>
                  <th>Semester</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} style={{ backgroundColor: row.is_registered ? "inherit" : "#ffe6e6" }}>
                    <td>{row.roll_no}</td>
                    <td>{row.name}</td>
                    <td>{row.grades}</td>
                    <td>{row.remarks}</td>
                    <td>{row.semester}</td>
                    <td style={{ color: row.is_registered ? "green" : "red" }}>
                      {row.is_registered ? "Registered" : "Missing Registration"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Box mt="md" style={{ display: "flex", gap: "1rem" }}>
              <Button size="md" radius="sm" color="blue" onClick={handleSubmitGrades}>
                Submit
              </Button>
              <Button size="md" radius="sm" color="gray" onClick={handleCancelPreview}>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
        <LoadingOverlay visible={loading} overlayBlur={2} />
      </Paper>
    </Card>
  );
}

export default SubmitGrades;

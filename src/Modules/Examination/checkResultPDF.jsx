import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Paper,
  Text,
  Grid,
  Select,
  Button,
  Loader,
  Center,
  ScrollArea,
  Table,
  Box,
  Alert,
  Title,
  Image,
  Group,
  Stack,
  Badge,
  Divider,
  Container,
} from "@mantine/core";
import axios from "axios";
import { get_result_semesters, check_result } from "./routes/examinationRoutes";
import { host } from "../../routes/globalRoutes";

export default function CheckResult() {
  // semester picker
  const [selection, setSelection] = useState(null);
  const [semesters, setSemesters] = useState([]);
  
  // result & UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [spi, setSpi] = useState(0);
  const [cpi, setCpi] = useState(0);
  const [su, setSu] = useState(0);
  const [tu, setTu] = useState(0);
  const [show, setShow] = useState(false);
  
  // Student and academic info (fetch real data from API/localStorage)
  const [studentInfo, setStudentInfo] = useState({
    rollNumber: "",
    name: "",
    fatherName: "",
    programme: "",
    branch: "",
    batch: "",
    semester: "",
    academicYear: "",
    department: ""
  });

  const [collegeInfo, setCollegeInfo] = useState({
    fullName: "",
    shortName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    logo: null
  });

  // 1) Fetch semesters and student info on mount
  useEffect(() => {
    async function fetchSemesters() {
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await axios.get(get_result_semesters, {
          headers: { Authorization: `Token ${token}` },
        });
        if (data.success) {
          setSemesters(data.semesters);
        } else {
          setError(data.message || "Could not load semesters");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch semesters");
      }
    }

    // Fetch real student and college information
    const fetchStudentInfo = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (userData) {
          // Try to fetch complete profile from API
          try {
            const token = localStorage.getItem("authToken");
            const response = await axios.get(`${host}/academics/student_profile`, {
              headers: { Authorization: `Token ${token}` }
            });
            
            if (response.data && response.data.user) {
              const profile = response.data.user;
              setStudentInfo({
                rollNumber: profile.username || userData.roll_no || '',
                name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || userData.username || '',
                fatherName: profile.father_name || '',
                programme: userData.programme || profile.programme || '',
                branch: profile.branch || userData.department || '',
                batch: userData.batch || profile.batch || '',
                semester: profile.current_semester || '',
                department: userData.department || profile.department || '',
                academicYear: calculateAcademicYear(userData.batch)
              });
            }
          } catch (apiError) {
            // Fallback to localStorage data
            setStudentInfo({
              rollNumber: userData.roll_no || '',
              name: userData.username || '',
              fatherName: '',
              programme: userData.programme || '',
              branch: userData.department || '',
              batch: userData.batch || '',
              semester: '',
              department: userData.department || '',
              academicYear: calculateAcademicYear(userData.batch)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
    };

    const fetchCollegeInfo = () => {
      // In a real implementation, this would fetch from an API or config
      setCollegeInfo({
        fullName: "PDPM Indian Institute of Information Technology, Design & Manufacturing, Jabalpur",
        shortName: "IIITDM Jabalpur",
        address: "Dumna Airport Road",
        city: "Jabalpur",
        state: "Madhya Pradesh",
        pincode: "482005",
        logo: null
      });
    };

    // Helper function to calculate academic year from batch
    const calculateAcademicYear = (batch) => {
      if (!batch) return new Date().getFullYear() + "-" + (new Date().getFullYear() + 1).toString().slice(-2);
      const batchYear = parseInt(batch.split('-')[0]);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Academic year typically starts in July/August
      if (currentMonth >= 7) {
        return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      } else {
        return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
      }
    };

    fetchSemesters();
    fetchStudentInfo();
    fetchCollegeInfo();
  }, []);

  // 2) Build Select options
  const semesterOptions = useMemo(
    () =>
      semesters.map(({ semester_no, semester_type, label }) => ({
        value: JSON.stringify({ no: semester_no, type: semester_type }),
        label,
      })),
    [semesters]
  );

  // 3) Handle View Result
  const handleSearch = async () => {
    if (!selection) {
      setError("Please select a semester.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const { no, type } = JSON.parse(selection);
      const { data } = await axios.post(
        check_result,
        { semester_no: no, semester_type: type },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (data.success) {
        setCourses(data.courses || []);
        setSpi(data.spi || 0);
        setCpi(data.cpi || 0);
        setSu(data.su || 0);
        setTu(data.tu || 0);
        setShow(true);
      } else {
        setError(data.message || "No results found for the selected semester.");
        setShow(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch results. Please try again.");
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const data = courses.map((course) => ({
    coursecode: course.course_id?.course_code || "N/A",
    coursename: course.course_id?.course_name || "N/A",
    credits: course.course_id?.credits || 0,
    grade: course.grade || "N/A",
    points: course.grade_points || 0,
  }));

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Paper padding="md" shadow="xs" withBorder>
        <Title order={2} align="center" mb="lg">
          Check Result
        </Title>

        <Grid align="end">
          <Grid.Col span={8}>
            <Select
              label="Select Semester"
              placeholder="Choose a semester"
              data={semesterOptions}
              value={selection}
              onChange={setSelection}
              required
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Button 
              onClick={handleSearch} 
              loading={loading} 
              fullWidth
              disabled={!selection}
            >
              View Result
            </Button>
          </Grid.Col>
        </Grid>

        {error && (
          <Alert color="red" mt="md">
            {error}
          </Alert>
        )}

        {loading && (
          <Center mt="xl">
            <Loader size="lg" />
          </Center>
        )}

        {show && !loading && (
          <Box mt="xl">
            {/* PDF-Style Report Card */}
            <Paper 
              p={0} 
              withBorder 
              className="printable-report-card"
              style={{ 
                minHeight: '800px',
                backgroundColor: '#ffffff',
                boxShadow: 'none',
                border: '3px solid #000',
                fontFamily: 'Times New Roman, serif'
              }}
            >
              {/* Header - PDF Style */}
              <Box style={{ padding: '30px 20px', borderBottom: '2px solid #000', textAlign: 'center' }}>
                <Title order={1} style={{ 
                  color: '#000', 
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  lineHeight: '1.2'
                }}>
                  {collegeInfo.fullName}
                </Title>
                <Text size="sm" style={{ color: '#000', fontWeight: 'bold', marginBottom: '8px' }}>
                  (An Institute of National Importance under MoE, Govt. of India)
                </Text>
                <Text size="sm" style={{ 
                  color: '#000', 
                  fontWeight: 'bold', 
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}>
                  Semester Grade Report / Marksheet
                </Text>
              </Box>

              {/* Student Information Section - PDF Style */}
              <Box style={{ padding: '20px', borderBottom: '1px solid #000' }}>
                <Grid>
                  <Grid.Col span={6}>
                    <Stack spacing={8}>
                      <Text size="sm" style={{ color: '#000' }}>
                        <strong>Name of Student:</strong> {studentInfo.name || 'Student Name'}
                      </Text>
                      <Text size="sm" style={{ color: '#000' }}>
                        <strong>Programme:</strong> {studentInfo.programme || 'B.Tech'}
                      </Text>
                      <Text size="sm" style={{ color: '#000' }}>
                        <strong>Semester:</strong> {JSON.parse(selection || '{}').no || 'N/A'}
                      </Text>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Stack spacing={8}>
                      <Text size="sm" style={{ color: '#000' }}>
                        <strong>Roll No.:</strong> {studentInfo.rollNumber || 'Roll Number'}
                      </Text>
                      <Text size="sm" style={{ color: '#000' }}>
                        <strong>Branch:</strong> {studentInfo.branch || 'Computer Science & Engineering'}
                      </Text>
                      <Text size="sm" style={{ color: '#000' }}>
                        <strong>Academic Year:</strong> {studentInfo.academicYear || '2024-25'}
                      </Text>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Box>

              {/* Course Table - PDF Style */}
              <Box style={{ padding: '20px' }}>
                <Table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ 
                        border: '1px solid #000', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        S.<br/>No.
                      </th>
                      <th style={{ 
                        border: '1px solid #000', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Course<br/>Code
                      </th>
                      <th style={{ 
                        border: '1px solid #000', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Course Title
                      </th>
                      <th style={{ 
                        border: '1px solid #000', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Credits
                      </th>
                      <th style={{ 
                        border: '1px solid #000', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Grade
                      </th>
                      <th style={{ 
                        border: '1px solid #000', 
                        padding: '8px', 
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        Grade<br/>Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((course, index) => (
                      <tr key={index}>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '8px', 
                          textAlign: 'center',
                          fontSize: '12px'
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '8px', 
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {course.coursecode}
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '8px',
                          fontSize: '12px'
                        }}>
                          {course.coursename}
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '8px', 
                          textAlign: 'center',
                          fontSize: '12px'
                        }}>
                          {course.credits}
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '8px', 
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {course.grade}
                        </td>
                        <td style={{ 
                          border: '1px solid #000', 
                          padding: '8px', 
                          textAlign: 'center',
                          fontSize: '12px'
                        }}>
                          {course.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Summary Section */}
                <Box mt="lg" style={{ borderTop: '2px solid #000', paddingTop: '15px' }}>
                  <Grid>
                    <Grid.Col span={8}>
                      <Text size="sm" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        <strong>Total Credits Registered:</strong> {tu}
                      </Text>
                      <Text size="sm" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        <strong>Total Credits Earned:</strong> {su}
                      </Text>
                      <Text size="sm" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        <strong>SPI (Semester Performance Index):</strong> {spi.toFixed(2)}
                      </Text>
                      <Text size="sm" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        <strong>CPI (Cumulative Performance Index):</strong> {cpi.toFixed(2)}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Text size="sm" style={{ fontWeight: 'bold', textAlign: 'center', marginTop: '20px' }}>
                        <strong>Result Status:</strong> {spi >= 5.0 ? 'PASS' : 'FAIL'}
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Signatures Section */}
                <Box mt="xl" style={{ borderTop: '1px solid #000', paddingTop: '30px' }}>
                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="sm" style={{ textAlign: 'center' }}>
                        Assistant Registrar (Academic)
                      </Text>
                      <Text size="sm" style={{ textAlign: 'center', marginTop: '40px' }}>
                        Digitally Signed
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="sm" style={{ textAlign: 'center' }}>
                        Dean (Academic)
                      </Text>
                      <Text size="sm" style={{ textAlign: 'center', marginTop: '40px' }}>
                        Digitally Signed
                      </Text>
                    </Grid.Col>
                  </Grid>
                </Box>

                {/* Footer note */}
                <Box mt="md" style={{ textAlign: 'center' }}>
                  <Text size="xs" style={{ color: '#666' }}>
                    This is a computer-generated document. Generated on {new Date().toLocaleDateString('en-IN')}
                  </Text>
                </Box>
              </Box>
            </Paper>

            {/* Print Button */}
            <Center mt="lg">
              <Button 
                onClick={() => window.print()} 
                variant="outline"
                size="lg"
              >
                Print Report Card
              </Button>
            </Center>
          </Box>
        )}
      </Paper>
    </Card>
  );
}

// Add print styles
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    .printable-report-card {
      box-shadow: none !important;
      border: 2px solid #000 !important;
    }
    
    /* Hide everything except the report card when printing */
    body > div:not(.printable-report-card) {
      display: none !important;
    }
    
    .printable-report-card {
      display: block !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  }
`;

// Inject print styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = printStyles;
  document.head.appendChild(styleSheet);
}

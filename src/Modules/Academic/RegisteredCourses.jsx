import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, Text, Loader, Center, Select, Button, Box } from "@mantine/core";
import { IconPrinter } from "@tabler/icons-react";
import axios from "axios";
import downloadCourseRegistrationReceipt from "./courseRegistrationReceipt";
import {
  semesterOptionsRoute,
  currentCourseRegistrationRoute,
  courseRegistrationReceiptRoute,
  phdStudentStatusRoute,
  studentThesisEnrollmentRoute,
  studentProgressSeminarEnrollmentRoute,
  studentTeachingCreditEnrollmentRoute,
} from "../../routes/academicRoutes";
import { getProfileDataRoute } from "../../routes/dashboardRoutes";
import FusionTable from "../../components/FusionTable";

export default function RegisteredCourses() {
  const [courses, setCourses] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [semesterValue, setSemesterValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState({});

  const user = useSelector((state) => state.user);

  useEffect(() => {
    // Student-only view: skip the student endpoints until the role resolves to 'student' (avoids a 403 when mounted for other roles).
    if (user?.role !== "student") {
      setLoading(false);
      return;
    }

    const fetchStudentProfile = async () => {
      const getValueSafely = (obj, paths) => {
        for (const path of paths) {
          const value = path.split(".").reduce((o, p) => o?.[p], obj);
          if (value) return value;
        }
        return "";
      };

      const extractStudentData = (data) => {
        const userData = data?.user || data?.current?.[0]?.user || data;

        let batchFromPattern = "";
        const rollNumber =
          data?.profile?.id || userData?.roll_no || userData?.username;
        if (rollNumber && /^(\d{2})\w+/.test(rollNumber)) {
          const yearMatch = rollNumber.match(/^(\d{2})/);
          if (yearMatch) {
            batchFromPattern = `20${yearMatch[1]}`;
          }
        }

        return {
          name:
            getValueSafely(userData, ["first_name", "name", "username"]) +
            (userData?.last_name ? ` ${userData.last_name}` : ""),
          rollNo:
            data?.profile?.id ||
            getValueSafely(userData, [
              "roll_no",
              "username",
              "id",
              "student_id",
            ]) ||
            getValueSafely(data, ["roll_no", "id", "student_id"]),
          programme:
            getValueSafely(data, [
              "profile.programme.name",
              "programme.name",
              "programme",
            ]) || "B.Tech",
          batch:
            getValueSafely(data, [
              "profile.batch",
              "batch",
              "year",
              "academic_year",
              "joining_year",
            ]) ||
            getValueSafely(userData, [
              "batch",
              "year",
              "academic_year",
              "joining_year",
            ]) ||
            batchFromPattern,
          department: getValueSafely(data, [
            "profile.department.name",
            "department.name",
            "department",
            "branch",
          ]),
        };
      };

      try {
        if (user?.username && user.username !== "User") {
          setStudentInfo(extractStudentData(user));
        }

        const token = localStorage.getItem("authToken");
        if (token) {
          try {
            const response = await axios.get(getProfileDataRoute, {
              headers: { Authorization: `Token ${token}` },
            });

            if (response.data) {
              const profileData = Array.isArray(response.data)
                ? response.data[0]
                : response.data;
              setStudentInfo((prev) => ({
                ...prev,
                ...extractStudentData(profileData),
              }));
            }
          } catch (error) {
            setStudentInfo((prev) => ({
              ...prev,
              ...extractStudentData(user),
            }));
          }
        }
      } catch (error) {
        setStudentInfo(extractStudentData(user));
      }
    };

    (async () => {
      try {
        await fetchStudentProfile();

        const token = localStorage.getItem("authToken");
        const optsRes = await axios.get(semesterOptionsRoute, {
          headers: { Authorization: `Token ${token}` },
        });
        const formattedOptions = optsRes.data.semesters.map(
          ({ semester_no, semester_type, label }) => ({
            value: JSON.stringify({
              no: Number(semester_no),
              type: semester_type,
            }),
            label,
          }),
        );
        setSemesterOptions(formattedOptions);
        await fetchCourses(undefined, formattedOptions);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    })();
  }, [user]);

  // For PhD students, thesis/progress-seminar/teaching-credit registrations
  // never land in course_registration (see project notes on why), so this
  // shared "Registered Courses" screen has no way to see them otherwise.
  // Once verified, synthesize them into the same row shape (course_id.code/
  // name/credit, registration_type, semester_id.semester_no) so the existing
  // table/PDF/print code needs no special-casing. Only shown for the
  // semester currently being viewed, since those endpoints only know the
  // student's current semester, not historical ones.
  const fetchPhdExtras = async (token, viewedSemesterNo) => {
    try {
      const statusRes = await axios.get(phdStudentStatusRoute, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!statusRes.data?.is_phd) return [];

      const [thesisRes, seminarRes, teachingCreditRes] = await Promise.all([
        axios.get(studentThesisEnrollmentRoute, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(studentProgressSeminarEnrollmentRoute, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(studentTeachingCreditEnrollmentRoute, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      const extras = [];
      const thesisReg = thesisRes.data?.registration;
      if (
        thesisReg?.status === "verified" &&
        thesisReg.semester_no === viewedSemesterNo
      ) {
        const t = thesisRes.data.thesis_slot?.resolved_thesis;
        extras.push({
          course_id: {
            code: t?.code || "THESIS",
            name: t?.name || "Thesis",
            credit: thesisReg.credits,
          },
          registration_type: "Thesis",
          semester_id: { semester_no: thesisReg.semester_no },
        });
      }
      const seminarReg = seminarRes.data?.registration;
      if (
        seminarReg?.status === "verified" &&
        seminarReg.semester_no === viewedSemesterNo
      ) {
        const s = seminarRes.data.progress_seminar_slot?.resolved_seminar;
        extras.push({
          course_id: {
            code: s?.code || "SEMINAR",
            name: s?.name || "Progress Seminar",
            credit: s?.credit ?? 0,
          },
          registration_type: "Progress Seminar",
          semester_id: { semester_no: seminarReg.semester_no },
        });
      }
      const tcReg = teachingCreditRes.data?.registration;
      if (
        tcReg?.status === "verified" &&
        tcReg.semester_no === viewedSemesterNo
      ) {
        const t =
          teachingCreditRes.data.teaching_credit_slot?.resolved_teaching_credit;
        extras.push({
          course_id: {
            code: t?.code || "TEACHCR",
            name: t?.name || "Teaching Credit",
            credit: t?.credit ?? 0,
          },
          registration_type: "Teaching Credit",
          semester_id: { semester_no: tcReg.semester_no },
        });
      }
      return extras;
    } catch {
      return [];
    }
  };

  const fetchCourses = async (semJson, opts = semesterOptions) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      let url = currentCourseRegistrationRoute;
      if (semJson) {
        const { no, type } = JSON.parse(semJson);
        const params = new URLSearchParams({
          semester: no.toString(),
          semester_type: type,
        });
        url += `?${params.toString()}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Token ${token}` },
      });

      const phdExtras = await fetchPhdExtras(token, Number(res.data.sem_no));
      setCourses([...(res.data.reg_data || []), ...phdExtras]);

      setStudentInfo((prev) => ({
        ...prev,
        semester: res.data.sem_no || prev.semester,
        semesterType: res.data.semester_type || prev.semesterType,
        name: user?.username?.replace(/[_\s]+$/, "") || prev.name,
        rollNo: user?.roll_no || prev.rollNo,
      }));
      axios
        .get(courseRegistrationReceiptRoute, {
          headers: { Authorization: `Token ${token}` },
        })
        .then((receiptResponse) => {
          if (receiptResponse.data) {
            setStudentInfo((prev) => ({
              ...prev,
              department: receiptResponse.data.branch || prev.department,
              prevSemCpi: receiptResponse.data.prev_sem_cpi,
              prevSemesterNo: receiptResponse.data.prev_semester_no,
            }));
          }
        })
        .catch(() => {});

      const semNoNum = Number(res.data.sem_no);
      const semType = res.data.semester_type;
      const newValue = JSON.stringify({ no: semNoNum, type: semType });

      if (opts.some((opt) => opt.value === newValue)) {
        setSemesterValue(newValue);
      } else if (!semJson && opts.length) {
        const latestSemesterWithCourses = opts[opts.length - 1].value;
        await fetchCourses(latestSemesterWithCourses, opts);
      } else {
        setSemesterValue("");
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  const handleSemesterChange = (value) => {
    setSemesterValue(value);
    fetchCourses(value);
  };

  const rows = courses.map((course) => ({
    "Course Code": course.course_id?.code || "",
    "Course Name": course.course_id?.name || "",
    "Registration Type": course.registration_type || "",
    Semester: course.semester_id?.semester_no || "",
    Credits: course.course_id?.credit || 0,
    "Replaced By":
      course.replaced_by?.length > 0
        ? course.replaced_by
            .map((r) => `${r.code} - ${r.name} (${r.label})`)
            .join(", ")
        : "-",
  }));

  const totalCredits = courses.reduce(
    (sum, c) => sum + (c.course_id?.credit || 0),
    0,
  );

  function DownloadRegistration() {
    const printRows = [...courses];
    for (let i = 0; i < 2; i++) {
      printRows.push({
        course_id: { code: "", name: "", credit: "" },
        registration_type: "",
      });
    }

    const tableStyle = {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "11px",
      marginBottom: "20px",
      border: "1px solid #000",
    };

    const thStyle = {
      border: "1px solid #000",
      padding: "8px",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "10px",
    };

    const tdStyle = {
      border: "1px solid #000",
      padding: "6px",
      fontSize: "10px",
    };

    const tdCenterStyle = {
      ...tdStyle,
      textAlign: "center",
    };

    function TableHeader() {
      return (
        <thead>
          <tr>
            <th style={thStyle}>S. No.</th>
            <th style={thStyle}>Course ID</th>
            <th style={thStyle}>Course Name</th>
            <th style={thStyle}>Credits</th>
            <th style={thStyle}>Registration Type</th>
            <th style={thStyle}>Remarks</th>
          </tr>
        </thead>
      );
    }

    function TableRow({ course, index }) {
      return (
        <tr key={index} style={{ minHeight: "25px" }}>
          <td style={tdCenterStyle}>{index + 1}</td>
          <td style={tdStyle}>{course.course_id?.code || ""}</td>
          <td style={tdStyle}>{course.course_id?.name || ""}</td>
          <td style={tdCenterStyle}>{course.course_id?.credit || ""}</td>
          <td style={tdCenterStyle}>{course.registration_type || ""}</td>
          <td style={tdStyle} />
        </tr>
      );
    }

    return (
      <Box
        id="download-registration"
        className="download-registration"
        style={{
          display: "none",
          backgroundColor: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.4",
          color: "black",
          width: "210mm",
          padding: "15mm",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "15px",
              borderBottom: "1px solid #000",
              paddingBottom: "5px",
            }}
          >
            STUDENT COPY
          </div>

          <div
            style={{
              fontSize: "11px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span>
              <strong>Batch:</strong> {studentInfo.batch || ""}
            </span>
            <span>
              <strong>Name:</strong> {studentInfo.name || ""}
            </span>
            <span>
              <strong>Roll No.:</strong> {studentInfo.rollNo || ""}
            </span>
            <span>
              <strong>Branch:</strong> {studentInfo.department || ""}
            </span>
            <span>
              <strong>Semester:</strong> {studentInfo.semester || ""}
            </span>
          </div>

          <table style={tableStyle}>
            <TableHeader />
            <tbody>
              {printRows.map((course, index) => (
                <TableRow key={index} course={course} index={index} />
              ))}
            </tbody>
          </table>

          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Total Credits:
          </div>

          <div
            style={{ fontSize: "9px", lineHeight: "1.3", marginBottom: "20px" }}
          >
            1. I have more than 75% attendance in the above mentioned subjects.
            <br />
            2. The above courses do not clash with any other courses.
            <br />
            <br />
            <strong>Additional notes:</strong>
            <br />
            <div
              style={{
                borderBottom: "1px solid #000",
                margin: "10px 0",
                height: "15px",
              }}
            />
            <div
              style={{
                borderBottom: "1px solid #000",
                margin: "10px 0",
                height: "15px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <div style={{ textAlign: "center", width: "180px" }}>
              <div
                style={{
                  borderBottom: "1px solid #000",
                  height: "30px",
                  marginBottom: "5px",
                }}
              />
              <div style={{ fontSize: "9px", fontWeight: "bold" }}>
                Student's Signature
              </div>
            </div>
            <div style={{ textAlign: "center", width: "180px" }}>
              <div
                style={{
                  borderBottom: "1px solid #000",
                  height: "30px",
                  marginBottom: "5px",
                }}
              />
              <div style={{ fontSize: "9px", fontWeight: "bold" }}>
                Admin's Signature
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px dotted #000",
            margin: "20px 0",
            textAlign: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              padding: "0 10px",
              fontSize: "8px",
              color: "#666",
            }}
          />
        </div>

        <div>
          <div
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "15px",
              borderBottom: "1px solid #000",
              paddingBottom: "5px",
            }}
          >
            ACADEMIC COPY
          </div>

          <div
            style={{
              fontSize: "11px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span>
              <strong>Batch:</strong> {studentInfo.batch || ""}
            </span>
            <span>
              <strong>Name:</strong> {studentInfo.name || ""}
            </span>
            <span>
              <strong>Roll No.:</strong> {studentInfo.rollNo || ""}
            </span>
            <span>
              <strong>Branch:</strong> {studentInfo.department || ""}
            </span>
            <span>
              <strong>Semester:</strong> {studentInfo.semester || ""}
            </span>
          </div>

          <table style={tableStyle}>
            <TableHeader />
            <tbody>
              {printRows.map((course, index) => (
                <TableRow key={index} course={course} index={index} />
              ))}
            </tbody>
          </table>

          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            Total Credits:
          </div>

          <div
            style={{ fontSize: "9px", lineHeight: "1.3", marginBottom: "20px" }}
          >
            1. I have more than 75% attendance in the above mentioned subjects.
            <br />
            2. The above courses do not clash with any other courses.
            <br />
            <br />
            <strong>Additional notes:</strong>
            <br />
            <div
              style={{
                borderBottom: "1px solid #000",
                margin: "10px 0",
                height: "15px",
              }}
            />
            <div
              style={{
                borderBottom: "1px solid #000",
                margin: "10px 0",
                height: "15px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <div style={{ textAlign: "center", width: "180px" }}>
              <div
                style={{
                  borderBottom: "1px solid #000",
                  height: "30px",
                  marginBottom: "5px",
                }}
              />
              <div style={{ fontSize: "9px", fontWeight: "bold" }}>
                Student's Signature
              </div>
            </div>
            <div style={{ textAlign: "center", width: "180px" }}>
              <div
                style={{
                  borderBottom: "1px solid #000",
                  height: "30px",
                  marginBottom: "5px",
                }}
              />
              <div style={{ fontSize: "9px", fontWeight: "bold" }}>
                admin's Signature
              </div>
            </div>
          </div>
        </div>
      </Box>
    );
  }

  const handlePrint = () =>
    downloadCourseRegistrationReceipt({ studentInfo, courses, totalCredits });

  if (loading) {
    return (
      <Center style={{ height: "200px" }}>
        <Loader size="lg" variant="dots" />
      </Center>
    );
  }

  if (error) {
    return <Text c="red">Error: {error.message}</Text>;
  }

  return (
    <>
      <Card shadow="sm" p="lg" radius="md" withBorder>

        <Select
          label="Select Semester"
          placeholder="Select a semester"
          data={semesterOptions}
          value={semesterValue}
          onChange={handleSemesterChange}
          mb="md"
        />

        <div style={{ overflowX: "auto" }}>
          <FusionTable
            columnNames={[
              "Course Code",
              "Course Name",
              "Registration Type",
              "Semester",
              "Credits",
              "Replaced By",
            ]}
            elements={rows}
            width="100%"
          />
        </div>

        <Text size="md" fw={700} mt="md">
          Total Credits: {totalCredits}
        </Text>

        <Center mt="lg">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={courses.length === 0}
            leftSection={<IconPrinter size={16} />}
          >
            Download
          </Button>
        </Center>
      </Card>

      <DownloadRegistration />
    </>
  );
}

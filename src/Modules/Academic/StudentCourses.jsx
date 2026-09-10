import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Text,
  Button,
  TextInput,
  Alert,
  Modal,
  Group,
  Select,
  Loader,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import FusionTable from "../../components/FusionTable";
import { courseLabel } from "../../lib/course";
import downloadCourseRegistrationReceipt from "./courseRegistrationReceipt";
import {
  addStudentCourseRoute,
  addStudentThesisRoute,
  addStudentProgressSeminarRoute,
  addStudentTeachingCreditRoute,
  dropStudentCourseRoute,
  getStudentCourseRoute,
  getCourseSlotsRoute,
  getCoursesRoute,
  getThesisSlotsRoute,
  getThesisCoursesRoute,
  getProgressSeminarSlotsRoute,
  getProgressSeminarCoursesRoute,
  getTeachingCreditSlotsRoute,
  getTeachingCreditCoursesRoute,
  adminThesisEnrollmentListRoute,
  adminProgressSeminarEnrollmentListRoute,
  adminTeachingCreditEnrollmentListRoute,
} from "../../routes/academicRoutes";

function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem("authToken")}` };
}

// Thesis/progress-seminar/teaching-credit registrations never land in
// course_registration (see project notes), so this admin lookup -- which is
// entirely driven by course_registration via getStudentCourseRoute -- has no
// way to see them otherwise. The admin list endpoints return every student's
// entries; filter down to this one roll number and synthesize rows shaped
// like a normal course_registration detail so the existing table/Add/Drop
// code needs no special-casing (Drop is disabled for these since there's no
// equivalent "drop a thesis enrollment" action).
async function fetchPhdExtraDetails(rollNo) {
  try {
    const [thesisRes, seminarRes, teachingCreditRes] = await Promise.all([
      axios.get(adminThesisEnrollmentListRoute, { headers: authHeaders() }),
      axios.get(adminProgressSeminarEnrollmentListRoute, {
        headers: authHeaders(),
      }),
      axios.get(adminTeachingCreditEnrollmentListRoute, {
        headers: authHeaders(),
      }),
    ]);
    const rollUpper = rollNo.toUpperCase();
    const semType = (semNo) =>
      semNo % 2 === 1 ? "Odd Semester" : "Even Semester";

    const extras = [];
    (thesisRes.data.registrations || [])
      .filter(
        (r) =>
          r.student?.id?.toUpperCase() === rollUpper && r.status === "verified",
      )
      .forEach((r) => {
        const t = r.thesis_slot?.resolved_thesis;
        extras.push({
          id: `thesis-${r.id}`,
          isPhdExtra: true,
          rid: "THESIS",
          course_id: t?.code || "THESIS",
          course_name: t?.name || "Thesis",
          credits: r.credits,
          sem: r.semester_no,
          semester_type: semType(r.semester_no),
          registration_type: "Thesis",
          replaced_by: [],
        });
      });
    (seminarRes.data.registrations || [])
      .filter(
        (r) =>
          r.student?.id?.toUpperCase() === rollUpper && r.status === "verified",
      )
      .forEach((r) => {
        const s = r.progress_seminar_slot?.resolved_seminar;
        extras.push({
          id: `seminar-${r.id}`,
          isPhdExtra: true,
          rid: "SEMINAR",
          course_id: s?.code || "SEMINAR",
          course_name: s?.name || "Progress Seminar",
          credits: s?.credit ?? 0,
          sem: r.semester_no,
          semester_type: semType(r.semester_no),
          registration_type: "Progress Seminar",
          replaced_by: [],
        });
      });
    (teachingCreditRes.data.registrations || [])
      .filter(
        (r) =>
          r.student?.id?.toUpperCase() === rollUpper && r.status === "verified",
      )
      .forEach((r) => {
        const t = r.teaching_credit_slot?.resolved_teaching_credit;
        extras.push({
          id: `teaching-credit-${r.id}`,
          isPhdExtra: true,
          rid: "TEACHCR",
          course_id: t?.code || "TEACHCR",
          course_name: t?.name || "Teaching Credit",
          credits: t?.credit ?? 0,
          sem: r.semester_no,
          semester_type: semType(r.semester_no),
          registration_type: "Teaching Credit",
          replaced_by: [],
        });
      });
    return extras;
  } catch {
    return [];
  }
}

const defaultSemesterOptions = [
  {
    value: JSON.stringify({ no: 1, type: "Odd Semester" }),
    label: "Semester 1 (Odd)",
  },
  {
    value: JSON.stringify({ no: 2, type: "Even Semester" }),
    label: "Semester 2 (Even)",
  },
  {
    value: JSON.stringify({ no: 2, type: "Summer Semester" }),
    label: "Summer Term 1",
  },
  {
    value: JSON.stringify({ no: 3, type: "Odd Semester" }),
    label: "Semester 3 (Odd)",
  },
  {
    value: JSON.stringify({ no: 4, type: "Even Semester" }),
    label: "Semester 4 (Even)",
  },
  {
    value: JSON.stringify({ no: 4, type: "Summer Semester" }),
    label: "Summer Term 2",
  },
  {
    value: JSON.stringify({ no: 5, type: "Odd Semester" }),
    label: "Semester 5 (Odd)",
  },
  {
    value: JSON.stringify({ no: 6, type: "Even Semester" }),
    label: "Semester 6 (Even)",
  },
  {
    value: JSON.stringify({ no: 6, type: "Summer Semester" }),
    label: "Summer Term 3",
  },
  {
    value: JSON.stringify({ no: 7, type: "Odd Semester" }),
    label: "Semester 7 (Odd)",
  },
  {
    value: JSON.stringify({ no: 8, type: "Even Semester" }),
    label: "Semester 8 (Even)",
  },
  {
    value: JSON.stringify({ no: 8, type: "Summer Semester" }),
    label: "Summer Term 4",
  },
  {
    value: JSON.stringify({ no: 9, type: "Odd Semester" }),
    label: "Semester 9 (Odd)",
  },
  {
    value: JSON.stringify({ no: 10, type: "Even Semester" }),
    label: "Semester 10 (Even)",
  },
  {
    value: JSON.stringify({ no: 10, type: "Summer Semester" }),
    label: "Summer Term 5",
  },
  {
    value: JSON.stringify({ no: 11, type: "Odd Semester" }),
    label: "Semester 11 (Odd)",
  },
  {
    value: JSON.stringify({ no: 12, type: "Even Semester" }),
    label: "Semester 12 (Even)",
  },
  {
    value: JSON.stringify({ no: 12, type: "Summer Semester" }),
    label: "Summer Term 6",
  },
];

export default function StudentCourses() {
  const [rollNo, setRollNo] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addThesisModalOpen, setAddThesisModalOpen] = useState(false);
  const [addSeminarModalOpen, setAddSeminarModalOpen] = useState(false);
  const [addTeachingCreditModalOpen, setAddTeachingCreditModalOpen] =
    useState(false);
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [courseToDrop, setCourseToDrop] = useState(null);
  const [courseToDropName, setCourseToDropName] = useState("");
  const [semSlots, setSemSlots] = useState([]);
  const [slotCourses, setSlotCourses] = useState([]);
  const [thesisSlots, setThesisSlots] = useState([]);
  const [thesisCourses, setThesisCourses] = useState([]);
  const [seminarSlots, setSeminarSlots] = useState([]);
  const [seminarCourses, setSeminarCourses] = useState([]);
  const [teachingCreditSlots, setTeachingCreditSlots] = useState([]);
  const [teachingCreditCourses, setTeachingCreditCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [newCourse, setNewCourse] = useState({
    semester_id: null,
    semester_no: null,
    semester_type: null,
    courseslot_id: null,
    course_id: null,
    academic_year: null,
    registration_type: null,
    course_instructor_id: null,
    old_course: null,
  });
  const [newThesis, setNewThesis] = useState({
    semester_no: null,
    thesis_slot_id: null,
    thesis_id: null,
    credits: "6",
  });
  const [newSeminar, setNewSeminar] = useState({
    semester_no: null,
    seminar_slot_id: null,
    seminar_id: null,
  });
  const [newTeachingCredit, setNewTeachingCredit] = useState({
    semester_no: null,
    teaching_credit_slot_id: null,
    teaching_credit_id: null,
  });

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const start = now.getMonth() >= 6 ? year : year - 1;
    const yrs = [];
    for (let i = 0; i < 5; i += 1) {
      const y1 = start - i;
      const y2 = y1 + 1;
      yrs.push(`${y1}-${String(y2).slice(-2)}`);
    }
    setAcademicYears(yrs);
  }, []);

  const clearError = () => setError("");

  const handleGetCourses = async () => {
    clearError();
    setStudentData(null);
    if (!rollNo) return setError("Enter a roll number");
    const token = localStorage.getItem("authToken");
    if (!token) return setError("Auth token missing");

    setLoading(true);
    try {
      const { data } = await axios.post(
        getStudentCourseRoute,
        { rollno: rollNo },
        { headers: { Authorization: `Token ${token}` } },
      );

      const phdExtras = await fetchPhdExtraDetails(rollNo);
      data.details = [...(data.details || []), ...phdExtras];
      setStudentData(data);

      if (data.current_semester) {
        // Derive the semester type from the semester number's parity so the
        // value always matches a dropdown option (odd no -> Odd Semester,
        // even no -> Even Semester). The backend's month-based type can
        // otherwise conflict with an even/odd semester number and leave the
        // Select empty.
        const no = Number(data.current_semester.semester_no);
        setSelectedSemester({
          no,
          type: no % 2 === 1 ? "Odd Semester" : "Even Semester",
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine semester type
  const getSemesterType = (semNo) => {
    if (semNo % 2 === 1) return "Odd Semester";
    return "Even Semester";
  };

  // Generate semester options from API data or use defaults
  const semesterOptions = useMemo(() => {
    // Check if this is a PhD student by checking batch name from response
    const isPhdStudent =
      studentData?.dict2?.roll_no?.toUpperCase().includes("PCS") ||
      (studentData?.details &&
        studentData.details.length > 0 &&
        studentData.details[0]?.course_name?.includes("PhD"));

    // For PhD students, use the filtered list from API
    if (
      isPhdStudent &&
      studentData?.semester_list &&
      studentData.semester_list.length > 0
    ) {
      return studentData.semester_list.map((sem) => ({
        value: JSON.stringify({
          no: sem.semester_no,
          type: getSemesterType(sem.semester_no),
        }),
        label: `Semester ${sem.semester_no} (${sem.semester_no % 2 === 1 ? "Odd" : "Even"})`,
      }));
    }

    // For UG/PG students, use the full default list with summer terms
    return defaultSemesterOptions;
  }, [studentData]);

  const confirmDrop = (rid, name) => {
    setCourseToDrop(rid);
    setCourseToDropName(name);
    setDropModalOpen(true);
  };

  const handleDrop = async () => {
    clearError();
    const token = localStorage.getItem("authToken");
    if (!token || courseToDrop == null || !rollNo)
      return setError("Missing data to drop");

    setLoading(true);
    try {
      await axios.post(
        dropStudentCourseRoute,
        { id: courseToDrop, roll_no: rollNo },
        { headers: { Authorization: `Token ${token}` } },
      );
      showNotification({
        title: "Course Dropped",
        message: "Course has been dropped successfully",
        color: "green",
      });
      await handleGetCourses();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Drop failed");
    } finally {
      setLoading(false);
      setDropModalOpen(false);
    }
  };

  const handleAddCourse = async () => {
    clearError();
    const {
      semester_id,
      semester_type,
      courseslot_id,
      course_id,
      academic_year,
      registration_type,
      old_course,
    } = newCourse;
    if (
      !semester_id ||
      !semester_type ||
      !courseslot_id ||
      !course_id ||
      !academic_year ||
      !registration_type
    ) {
      return setError("Fill all required fields");
    }
    const token = localStorage.getItem("authToken");
    if (!token) return setError("Auth token missing");

    const form = new FormData();
    form.append("roll_no", rollNo);
    form.append("semester_id", semester_id);
    form.append("semester_type", semester_type);
    form.append("courseslot_id", courseslot_id);
    form.append("course_id", course_id);
    form.append("academic_year", academic_year);
    form.append("registration_type", registration_type);
    if (newCourse.course_instructor_id)
      form.append("course_instructor_id", newCourse.course_instructor_id);
    if (old_course) form.append("old_course", old_course);

    setLoading(true);
    try {
      const res = await axios.post(addStudentCourseRoute, form, {
        headers: { Authorization: `Token ${token}` },
      });
      if (res.status === 200) {
        setNewCourse({
          semester_id: null,
          semester_type: null,
          semester_no: null,
          courseslot_id: null,
          course_id: null,
          academic_year: null,
          registration_type: null,
          course_instructor_id: null,
          old_course: null,
        });
        showNotification({
          title: "Course Added",
          message: "Course has been added successfully",
          color: "green",
        });
        setAddModalOpen(false);
        await handleGetCourses();
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          "Add failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // Resolve a semester_no (from a Select value) to the actual Semester row id,
  // same lookup handleSemesterSelect uses for the Add Course modal.
  const resolveSemesterId = (semesterNo) => {
    if (studentData && studentData.semester_list) {
      const found = studentData.semester_list.find(
        (s) => s.semester_no === Number(semesterNo),
      );
      if (found) return found.id;
    }
    return semesterNo;
  };

  // Fetch a slot's catalog entries (Thesis/Seminar/TeachingCredit) -- same
  // shape as fetchSlotCourses above, one per registration type.
  const fetchThesisCourses = async (slotId) => {
    if (!slotId) return;
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(getThesisCoursesRoute, {
        params: { slot_id: slotId },
        headers: { Authorization: `Token ${token}` },
      });
      setThesisCourses(data);
    } catch {
      setError("Failed to load theses");
    }
  };

  const fetchSeminarCourses = async (slotId) => {
    if (!slotId) return;
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(getProgressSeminarCoursesRoute, {
        params: { slot_id: slotId },
        headers: { Authorization: `Token ${token}` },
      });
      setSeminarCourses(data);
    } catch {
      setError("Failed to load seminars");
    }
  };

  const fetchTeachingCreditCourses = async (slotId) => {
    if (!slotId) return;
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(getTeachingCreditCoursesRoute, {
        params: { slot_id: slotId },
        headers: { Authorization: `Token ${token}` },
      });
      setTeachingCreditCourses(data);
    } catch {
      setError("Failed to load teaching credits");
    }
  };

  const handleThesisSemesterSelect = async (val) => {
    clearError();
    if (!val) return;
    const semObj = JSON.parse(val);
    const semesterId = resolveSemesterId(semObj.no);
    setNewThesis((p) => ({
      ...p,
      semester_no: semObj.no,
      thesis_slot_id: null,
      thesis_id: null,
    }));
    setThesisCourses([]);
    setThesisSlots([]);
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(getThesisSlotsRoute, {
        params: { semester_id: semesterId },
        headers: { Authorization: `Token ${token}` },
      });
      setThesisSlots(data);
    } catch {
      setError("Failed to load thesis slots");
    }
  };

  const handleSeminarSemesterSelect = async (val) => {
    clearError();
    if (!val) return;
    const semObj = JSON.parse(val);
    const semesterId = resolveSemesterId(semObj.no);
    setNewSeminar((p) => ({
      ...p,
      semester_no: semObj.no,
      seminar_slot_id: null,
      seminar_id: null,
    }));
    setSeminarCourses([]);
    setSeminarSlots([]);
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(getProgressSeminarSlotsRoute, {
        params: { semester_id: semesterId },
        headers: { Authorization: `Token ${token}` },
      });
      setSeminarSlots(data);
    } catch {
      setError("Failed to load progress seminar slots");
    }
  };

  const handleTeachingCreditSemesterSelect = async (val) => {
    clearError();
    if (!val) return;
    const semObj = JSON.parse(val);
    const semesterId = resolveSemesterId(semObj.no);
    setNewTeachingCredit((p) => ({
      ...p,
      semester_no: semObj.no,
      teaching_credit_slot_id: null,
      teaching_credit_id: null,
    }));
    setTeachingCreditCourses([]);
    setTeachingCreditSlots([]);
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(getTeachingCreditSlotsRoute, {
        params: { semester_id: semesterId },
        headers: { Authorization: `Token ${token}` },
      });
      setTeachingCreditSlots(data);
    } catch {
      setError("Failed to load teaching credit slots");
    }
  };

  const handleAddThesis = async () => {
    clearError();
    if (!newThesis.semester_no) return setError("Select a semester");
    if (!newThesis.thesis_slot_id) return setError("Select a thesis slot");
    if (!newThesis.thesis_id) return setError("Select a thesis");
    const token = localStorage.getItem("authToken");
    if (!token) return setError("Auth token missing");

    setLoading(true);
    try {
      await axios.post(
        addStudentThesisRoute,
        {
          roll_no: rollNo,
          semester_id: resolveSemesterId(newThesis.semester_no),
          thesis_slot_id: newThesis.thesis_slot_id,
          thesis_id: newThesis.thesis_id,
          credits: newThesis.credits,
        },
        { headers: { Authorization: `Token ${token}` } },
      );
      showNotification({
        title: "Thesis Added",
        message: "Thesis registration added successfully",
        color: "green",
      });
      setAddThesisModalOpen(false);
      setNewThesis({
        semester_no: null,
        thesis_slot_id: null,
        thesis_id: null,
        credits: "6",
      });
      await handleGetCourses();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Add failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeminar = async () => {
    clearError();
    if (!newSeminar.semester_no) return setError("Select a semester");
    if (!newSeminar.seminar_slot_id) return setError("Select a seminar slot");
    if (!newSeminar.seminar_id) return setError("Select a seminar");
    const token = localStorage.getItem("authToken");
    if (!token) return setError("Auth token missing");

    setLoading(true);
    try {
      await axios.post(
        addStudentProgressSeminarRoute,
        {
          roll_no: rollNo,
          semester_id: resolveSemesterId(newSeminar.semester_no),
          seminar_slot_id: newSeminar.seminar_slot_id,
          seminar_id: newSeminar.seminar_id,
        },
        { headers: { Authorization: `Token ${token}` } },
      );
      showNotification({
        title: "Progress Seminar Added",
        message: "Progress seminar registration added successfully",
        color: "green",
      });
      setAddSeminarModalOpen(false);
      setNewSeminar({
        semester_no: null,
        seminar_slot_id: null,
        seminar_id: null,
      });
      await handleGetCourses();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Add failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeachingCredit = async () => {
    clearError();
    if (!newTeachingCredit.semester_no) return setError("Select a semester");
    if (!newTeachingCredit.teaching_credit_slot_id)
      return setError("Select a teaching credit slot");
    if (!newTeachingCredit.teaching_credit_id)
      return setError("Select a teaching credit");
    const token = localStorage.getItem("authToken");
    if (!token) return setError("Auth token missing");

    setLoading(true);
    try {
      await axios.post(
        addStudentTeachingCreditRoute,
        {
          roll_no: rollNo,
          semester_id: resolveSemesterId(newTeachingCredit.semester_no),
          teaching_credit_slot_id: newTeachingCredit.teaching_credit_slot_id,
          teaching_credit_id: newTeachingCredit.teaching_credit_id,
        },
        { headers: { Authorization: `Token ${token}` } },
      );
      showNotification({
        title: "Teaching Credit Added",
        message: "Teaching credit registration added successfully",
        color: "green",
      });
      setAddTeachingCreditModalOpen(false);
      setNewTeachingCredit({
        semester_no: null,
        teaching_credit_slot_id: null,
        teaching_credit_id: null,
      });
      await handleGetCourses();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Add failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterSelect = async (val) => {
    clearError();
    if (!val) return;
    const semObj = JSON.parse(val);

    let semesterId = semObj.no;
    if (studentData && studentData.semester_list) {
      const found = studentData.semester_list.find(
        (s) => String(s.semester_no) === String(semObj.no),
      );
      if (found) {
        semesterId = found.id;
      }
    }
    setNewCourse((p) => ({
      ...p,
      semester_id: semesterId,
      semester_no: semObj.no,
      semester_type: semObj.type,
      courseslot_id: null,
      course_id: null,
    }));
    setSlotCourses([]);
    setSemSlots([]);
    const token = localStorage.getItem("authToken");
    try {
      const { data } = await axios.get(
        `${getCourseSlotsRoute}?semester_id=${semesterId}`,
        { headers: { Authorization: `Token ${token}` } },
      );
      setSemSlots(data);
    } catch {
      setError("Failed to load slots");
    }
  };

  // Fetch a slot's courses. Passing the term makes the API include each course's
  // running sections, so the admin can pick one for a cross-section backlog/improvement.
  const fetchSlotCourses = async (slotId, academicYear, semesterType) => {
    if (!slotId) return;
    const token = localStorage.getItem("authToken");
    let url = `${getCoursesRoute}?courseslot_id=${slotId}`;
    if (academicYear && semesterType) {
      url += `&academic_year=${encodeURIComponent(academicYear)}&semester_type=${encodeURIComponent(semesterType)}`;
    }
    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Token ${token}` },
      });
      setSlotCourses(data);
    } catch {
      setError("Failed to load courses");
    }
  };

  const handleSlotChange = async (slotId) => {
    setNewCourse((p) => ({
      ...p,
      courseslot_id: slotId,
      course_id: null,
      course_instructor_id: null,
    }));
    fetchSlotCourses(slotId, newCourse.academic_year, newCourse.semester_type);
  };

  // Running sections of the selected course (present when the term is chosen).
  const courseSections =
    slotCourses.find((c) => String(c.id) === String(newCourse.course_id))
      ?.sections || [];

  const filteredDetails =
    studentData?.details.filter(
      (c) =>
        c.sem === selectedSemester.no &&
        c.semester_type === selectedSemester.type,
    ) || [];
  const totalCredits = filteredDetails.reduce((sum, c) => sum + c.credits, 0);

  // Same receipt the student downloads, for the semester on screen.
  const handleDownloadReceipt = () =>
    downloadCourseRegistrationReceipt({
      studentInfo: {
        batch: studentData?.dict2?.batch || "",
        name: `${studentData?.dict2?.firstname || ""} ${
          studentData?.dict2?.lastname || ""
        }`.trim(),
        rollNo: studentData?.dict2?.roll_no || "",
        department: studentData?.dict2?.branch || "",
        semester: selectedSemester?.no || "",
        prevSemCpi:
          studentData?.prev_sem_cpi?.[String(selectedSemester?.no)] || "",
      },
      courses: filteredDetails.map((c) => ({
        course_id: {
          code: c.course_id,
          name: c.course_name,
          credit: c.credits,
        },
        registration_type: c.registration_type,
      })),
      totalCredits,
    });

  const columns = [
    "Reg ID",
    "Course Code",
    "Course Name",
    "Credits",
    "Semester",
    "Type",
    "Replaced By",
    "Actions",
  ];
  const rows = filteredDetails.map((c) => ({
    id: c.id,
    "Reg ID": c.rid,
    "Course Code": c.course_id,
    "Course Name": c.course_name,
    Credits: c.credits,
    Semester:
      c.semester_type === "Summer Semester" ? `${c.sem} (Summer)` : c.sem,
    Type: c.registration_type,
    "Replaced By":
      c.replaced_by && c.replaced_by.length > 0
        ? c.replaced_by
            .map(
              (r) =>
                `${r.course_id.code} - ${r.course_id.name} (Sem ${r.semester_id.semester_no})`,
            )
            .join(", ")
        : "NA",
    Actions: c.isPhdExtra ? (
      <Text size="xs" c="dimmed">
        N/A
      </Text>
    ) : (
      <Button
        size="xs"
        variant="outline"
        color="red"
        onClick={() => confirmDrop(c.id, c.course_name)}
      >
        Drop
      </Button>
    ),
  }));

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group align="flex-end" gap="sm" wrap="wrap" mb="md">
        <TextInput
          label="Roll Number"
          placeholder="Enter roll number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && rollNo && !loading) handleGetCourses();
          }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Button onClick={handleGetCourses} disabled={!rollNo || loading}>
          {loading ? <Loader size="xs" /> : "Fetch Courses"}
        </Button>
      </Group>

      {error && (
        <Alert title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}

      {studentData && (
        <>
          <Select
            label="Choose Semester to View"
            placeholder="Select semester"
            data={semesterOptions}
            value={JSON.stringify(selectedSemester)}
            onChange={(val) =>
              setSelectedSemester(val ? JSON.parse(val) : null)
            }
            mb="md"
          />

          <Text size="lg" fw={700} mb="sm" ta="center" c="blue">
            Registered Courses
          </Text>
          <Text fw={500}>
            Name: {studentData.dict2.firstname} {studentData.dict2.lastname}
          </Text>
          <Text fw={500} mb="md">
            Roll No: {studentData.dict2.roll_no}
          </Text>

          <div style={{ overflowX: "auto" }}>
            <FusionTable columnNames={columns} elements={rows} width="100%" />
          </div>
          {rows.length === 0 && (
            <Text ta="center" c="dimmed" mt="sm">
              No courses found for Semester
            </Text>
          )}

          <Group justify="space-between" mt="lg" wrap="wrap">
            <Group gap="xs" wrap="wrap">
              <Button
                color="green"
                onClick={() => setAddModalOpen(true)}
                disabled={loading}
              >
                Add Course
              </Button>
              <Button
                color="teal"
                variant="outline"
                onClick={() => setAddThesisModalOpen(true)}
                disabled={loading}
              >
                Add Thesis
              </Button>
              <Button
                color="teal"
                variant="outline"
                onClick={() => setAddSeminarModalOpen(true)}
                disabled={loading}
              >
                Add Progress Seminar
              </Button>
              <Button
                color="teal"
                variant="outline"
                onClick={() => setAddTeachingCreditModalOpen(true)}
                disabled={loading}
              >
                Add Teaching Credit
              </Button>
            </Group>
            <Group gap="sm">
              <Button
                variant="light"
                onClick={handleDownloadReceipt}
                disabled={loading || filteredDetails.length === 0}
              >
                Download
              </Button>
              <Text fw={700}>Total Credits: {totalCredits}</Text>
            </Group>
          </Group>
        </>
      )}

      {/* Add Course Modal */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Course"
      >
        <Select
          label="Semester"
          placeholder="Select semester"
          data={semesterOptions}
          value={
            newCourse.semester_no && newCourse.semester_type
              ? JSON.stringify({
                  no: newCourse.semester_no,
                  type: newCourse.semester_type,
                })
              : ""
          }
          onChange={handleSemesterSelect}
          mb="sm"
        />
        <Select
          label="Course Slot"
          placeholder="Select slot"
          data={semSlots.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))}
          value={newCourse.courseslot_id}
          onChange={(v) => handleSlotChange(v)}
          mb="sm"
          disabled={!newCourse.semester_id}
        />
        <Select
          label="Course"
          placeholder="Select course"
          data={slotCourses.map((c) => ({
            value: String(c.id),
            label: `${courseLabel(c)} (${c.credit}cr)`,
          }))}
          value={newCourse.course_id}
          onChange={(v) => setNewCourse((p) => ({ ...p, course_id: v }))}
          mb="sm"
          disabled={!newCourse.courseslot_id}
        />
        <Select
          label="Academic Year"
          placeholder="Select academic year"
          data={academicYears.map((y) => ({ value: y, label: y }))}
          value={newCourse.academic_year}
          onChange={(v) => {
            setNewCourse((p) => ({
              ...p,
              academic_year: v,
              course_instructor_id: null,
            }));
            fetchSlotCourses(
              newCourse.courseslot_id,
              v,
              newCourse.semester_type,
            );
          }}
          mb="sm"
        />
        {courseSections.length > 0 && (
          <Select
            label="Section"
            placeholder="Select section"
            description="Running section — required for a backlog/improvement in another section"
            data={courseSections.map((sec) => ({
              value: String(sec.course_instructor_id),
              label: sec.section
                ? `Section ${sec.section} — ${sec.instructor}`
                : sec.instructor,
            }))}
            value={newCourse.course_instructor_id}
            onChange={(v) =>
              setNewCourse((p) => ({ ...p, course_instructor_id: v }))
            }
            mb="sm"
            clearable
          />
        )}
        <Select
          label="Registration Type"
          placeholder="Select type"
          data={["Regular", "Improvement", "Backlog", "Audit"]}
          value={newCourse.registration_type}
          onChange={(v) =>
            setNewCourse((p) => ({ ...p, registration_type: v }))
          }
          mb="md"
        />
        <Select
          label="Replace Course"
          placeholder="Select the course to replace"
          data={
            studentData
              ? studentData.details
                  .filter((course) => !course.isPhdExtra)
                  .map((course) => ({
                    value: course.reg_id.toString(),
                    label: `${course.course_id} - sem ${course.sem}`,
                  }))
              : []
          }
          value={newCourse.old_course}
          onChange={(value) =>
            setNewCourse((p) => ({ ...p, old_course: value }))
          }
          searchable
          mb="sm"
        />
        <Group justify="flex-end">
          <Button onClick={handleAddCourse} loading={loading}>
            Add
          </Button>
        </Group>
      </Modal>

      {/* Add Thesis Modal */}
      <Modal
        opened={addThesisModalOpen}
        onClose={() => setAddThesisModalOpen(false)}
        title="Add Thesis"
      >
        <Select
          label="Semester"
          placeholder="Select semester"
          data={semesterOptions}
          value={
            newThesis.semester_no
              ? JSON.stringify({
                  no: newThesis.semester_no,
                  type: getSemesterType(newThesis.semester_no),
                })
              : ""
          }
          onChange={handleThesisSemesterSelect}
          mb="sm"
        />
        <Select
          label="Thesis Slot"
          placeholder="Select slot"
          data={thesisSlots.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))}
          value={newThesis.thesis_slot_id}
          onChange={(v) => {
            // PG students have a fixed credit value per slot evaluation type
            // -- 3 for S/X (block-graded), 12 for decimal -- no free choice.
            // PhD students keep the free 3/6/9/12 choice below.
            const isPg = studentData?.dict2?.programme_category === "PG";
            const slot = thesisSlots.find((s) => String(s.id) === v);
            const lockedCredits =
              isPg && slot
                ? slot.evaluation_type === "blocks_sx"
                  ? "3"
                  : "12"
                : null;
            setNewThesis((p) => ({
              ...p,
              thesis_slot_id: v,
              thesis_id: null,
              credits: lockedCredits ?? p.credits,
            }));
            fetchThesisCourses(v);
          }}
          mb="sm"
          disabled={!newThesis.semester_no}
        />
        <Select
          label="Thesis"
          placeholder="Select thesis"
          data={thesisCourses.map((c) => ({
            value: String(c.id),
            label: `${c.code} - ${c.name} (${c.credit}cr)`,
          }))}
          value={newThesis.thesis_id}
          onChange={(v) => setNewThesis((p) => ({ ...p, thesis_id: v }))}
          mb="sm"
          disabled={!newThesis.thesis_slot_id}
        />
        <Select
          label="Credits"
          placeholder="Select credits"
          data={["3", "6", "9", "12"]}
          value={newThesis.credits}
          onChange={(v) => setNewThesis((p) => ({ ...p, credits: v }))}
          disabled={
            studentData?.dict2?.programme_category === "PG" &&
            !!newThesis.thesis_slot_id
          }
          description={
            studentData?.dict2?.programme_category === "PG" &&
            newThesis.thesis_slot_id
              ? "Fixed for PG students by the slot's evaluation type"
              : undefined
          }
          mb="md"
        />
        <Group justify="flex-end">
          <Button onClick={handleAddThesis} loading={loading}>
            Add
          </Button>
        </Group>
      </Modal>

      {/* Add Progress Seminar Modal */}
      <Modal
        opened={addSeminarModalOpen}
        onClose={() => setAddSeminarModalOpen(false)}
        title="Add Progress Seminar"
      >
        <Select
          label="Semester"
          placeholder="Select semester"
          data={semesterOptions}
          value={
            newSeminar.semester_no
              ? JSON.stringify({
                  no: newSeminar.semester_no,
                  type: getSemesterType(newSeminar.semester_no),
                })
              : ""
          }
          onChange={handleSeminarSemesterSelect}
          mb="sm"
        />
        <Select
          label="Seminar Slot"
          placeholder="Select slot"
          data={seminarSlots.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))}
          value={newSeminar.seminar_slot_id}
          onChange={(v) => {
            setNewSeminar((p) => ({
              ...p,
              seminar_slot_id: v,
              seminar_id: null,
            }));
            fetchSeminarCourses(v);
          }}
          mb="sm"
          disabled={!newSeminar.semester_no}
        />
        <Select
          label="Seminar"
          placeholder="Select seminar"
          data={seminarCourses.map((c) => ({
            value: String(c.id),
            label: `${c.code} - ${c.name} (${c.credit}cr)`,
          }))}
          value={newSeminar.seminar_id}
          onChange={(v) => setNewSeminar((p) => ({ ...p, seminar_id: v }))}
          mb="md"
          disabled={!newSeminar.seminar_slot_id}
        />
        <Group justify="flex-end">
          <Button onClick={handleAddSeminar} loading={loading}>
            Add
          </Button>
        </Group>
      </Modal>

      {/* Add Teaching Credit Modal */}
      <Modal
        opened={addTeachingCreditModalOpen}
        onClose={() => setAddTeachingCreditModalOpen(false)}
        title="Add Teaching Credit"
      >
        <Select
          label="Semester"
          placeholder="Select semester"
          data={semesterOptions}
          value={
            newTeachingCredit.semester_no
              ? JSON.stringify({
                  no: newTeachingCredit.semester_no,
                  type: getSemesterType(newTeachingCredit.semester_no),
                })
              : ""
          }
          onChange={handleTeachingCreditSemesterSelect}
          mb="sm"
        />
        <Select
          label="Teaching Credit Slot"
          placeholder="Select slot"
          data={teachingCreditSlots.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))}
          value={newTeachingCredit.teaching_credit_slot_id}
          onChange={(v) => {
            setNewTeachingCredit((p) => ({
              ...p,
              teaching_credit_slot_id: v,
              teaching_credit_id: null,
            }));
            fetchTeachingCreditCourses(v);
          }}
          mb="sm"
          disabled={!newTeachingCredit.semester_no}
        />
        <Select
          label="Teaching Credit"
          placeholder="Select teaching credit"
          data={teachingCreditCourses.map((c) => ({
            value: String(c.id),
            label: `${c.code} - ${c.name} (${c.credit}cr)`,
          }))}
          value={newTeachingCredit.teaching_credit_id}
          onChange={(v) =>
            setNewTeachingCredit((p) => ({ ...p, teaching_credit_id: v }))
          }
          mb="md"
          disabled={!newTeachingCredit.teaching_credit_slot_id}
        />
        <Group justify="flex-end">
          <Button onClick={handleAddTeachingCredit} loading={loading}>
            Add
          </Button>
        </Group>
      </Modal>

      {/* Confirm Drop Modal */}
      <Modal
        opened={dropModalOpen}
        onClose={() => setDropModalOpen(false)}
        title="Confirm Drop"
      >
        <Text>Are you sure you want to drop {courseToDropName}?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={() => setDropModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDrop} loading={loading}>
            Confirm
          </Button>
        </Group>
      </Modal>
    </Card>
  );
}

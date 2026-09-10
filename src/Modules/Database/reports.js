import CourseRegistrationsReport from "./reports/CourseRegistrationsReport";
import BacklogRegistrationsReport from "./reports/BacklogRegistrationsReport";
import StudentCreditTotalsReport from "./reports/StudentCreditTotalsReport";
import CourseRegistrationCountsReport from "./reports/CourseRegistrationCountsReport";
import SwayamRegistrationsReport from "./reports/SwayamRegistrationsReport";
import SemesterRegistrationsReport from "./reports/SemesterRegistrationsReport";

// One entry per report. Adding a report means adding an entry here; the list
// page and the report page both read from this.
export const DATABASE_REPORTS = [
  {
    id: "course-registrations",
    title: "Student course registrations",
    summary: "Roll number, name, batch, programme, slot, course and credit",
    filters: "Session, semester type, batch",
    Component: CourseRegistrationsReport,
  },
  {
    id: "backlog-registrations",
    title: "Backlog slot registrations",
    summary:
      "Students registered in a backlog slot, with the semester, slot and course",
    filters: "Session, semester type",
    Component: BacklogRegistrationsReport,
  },
  {
    id: "student-credit-totals",
    title: "Total credits registered",
    summary: "Credits each student of a batch registered in the term",
    filters: "Session, semester type, batch",
    Component: StudentCreditTotalsReport,
  },
  {
    id: "course-registration-counts",
    title: "Course-wise registration count",
    summary: "How many students registered in each course, busiest first",
    filters: "Session, semester type, programme (optional)",
    Component: CourseRegistrationCountsReport,
  },
  {
    id: "swayam-registrations",
    title: "Swayam course registrations",
    summary: "Students registered in a Swayam course, with the slot semester",
    filters: "Session, semester type, batch (optional)",
    Component: SwayamRegistrationsReport,
  },
  {
    id: "semester-registrations",
    title: "Semester-wise registrations of a batch",
    summary: "Every course a batch registered in one semester, with credits",
    filters: "Batch, semester",
    Component: SemesterRegistrationsReport,
  },
];

export const findReport = (id) =>
  DATABASE_REPORTS.find((report) => report.id === id);

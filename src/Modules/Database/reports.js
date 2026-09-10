import CourseRegistrationsReport from "./reports/CourseRegistrationsReport";
import BacklogRegistrationsReport from "./reports/BacklogRegistrationsReport";

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
];

export const findReport = (id) =>
  DATABASE_REPORTS.find((report) => report.id === id);

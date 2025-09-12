import { host } from "../globalRoutes";

export const calendarRoute = `${host}/aims/api/calendar/`;
export const editCalendarRoute = `${host}/aims/api/calendar/update/`;
export const addCalendarRoute = `${host}/aims/api/calendar/add/`;
export const deleteCalendarRoute = `${host}/aims/api/calendar/delete/`;
export const clearCalendarRoute = `${host}/aims/api/calendar/clear/`;
export const exportCalendarRoute = `${host}/aims/api/calendar/export/`;
export const importCalendarRoute = `${host}/aims/api/calendar/import/`;
export const studentCalenderRoute = `${host}/academic-procedures/api/stu/calendar/student`;
export const nextSemCoursesRoute = `${host}/academic-procedures/api/stu/next_sem_courses/`;
export const currentCourseRegistrationRoute = `${host}/academic-procedures/api/stu/current_courseregistration`;
export const preCourseRegistrationRoute = `${host}/academic-procedures/api/stu/preregistration/`;
export const preCourseRegistrationSubmitRoute = `${host}/academic-procedures/api/stu/preregistration/submit/`;
export const swayamRegistrationRoute = `${host}/academic-procedures/api/stu/swayam_courses/`;
export const swayamRegistrationSubmitRoute = `${host}/academic-procedures/api/stu/swayam/submit/`;
export const finalRegistrationPageRoute = `${host}/academic-procedures/api/stu/finalregistrationpage/`;
export const finalRegistrationRoute = `${host}/academic-procedures/api/stu/final_registration/`;
export const studentListRoute = `${host}/academic-procedures/api/acad/student_list/`;
export const courseListRoute = `${host}/academic-procedures/api/acad/course_list/`;
export const verifyRegistrationRoute = `${host}/academic-procedures/api/acad/verify_registration/`;
export const batchesRoute = `${host}/programme_curriculum/api/admin_batches/`;
export const checkAllocationRoute = `${host}/aims/api/check-allocation`;
export const startAllocationRoute = `${host}/aims/api/start-allocation`;
export const getStudentCourseRoute = `${host}/academic-procedures/api/acad/verify_course/`;
export const dropStudentCourseRoute = `${host}/academic-procedures/api/acad/verify_course/drop/`;
export const addStudentCourseRoute = `${host}/academic-procedures/api/acad/addCourse/`;
export const generatexlsheet = `${host}/aims/api/generatexlsheet`;
export const availableCoursesRoute = `${host}/aims/api/available-courses`;
export const academicProceduresFaculty = `${host}/academic-procedures/api/fac/academic_procedures_faculty`;
export const getAllCourses = `${host}/academic-procedures/api/acad/get_all_courses`;
export const generateprereport = `${host}/aims/api/generate_preregistration_report/`;
export const searchPreRegistrationRoute = `${host}/academic-procedures/api/acad/search_preregistration/`;
export const deletePreRegistrationRoute = `${host}/academic-procedures/api/acad/delete_preregistration/`;
export const allotCoursesRoute = `${host}/academic-procedures/api/acad/allot_courses/`;
export const getCourseSlotsRoute = `${host}/academic-procedures/api/acad/get_add_course_slots/`;
export const getCoursesRoute = `${host}/academic-procedures/api/acad/get_add_courses/`;
export const editStudentCourseRoute = "/academic-procedures/api/editcourseadmin/";
export const getSingleCourseRoute   = "/academic-procedures/api/studentcourse/";
export const semesterOptionsRoute = `${host}/academic-procedures/api/stu/course_reg/semesters/` 

// HOD
export const HOD_STUDENTS_URL       = `${host}/academic-procedures/api/hod/students/?role=hod`;
export const HOD_ASSIGN_MANUAL_URL  = `${host}/academic-procedures/api/hod/assign/`;
export const HOD_UPLOAD_EXCEL_URL   = `${host}/academic-procedures/api/hod/assign/upload-excel/`;
export const HOD_PENDING_URL        = `${host}/academic-procedures/api/hod/pending/?role=hod`;
export const HOD_APPROVED_URL       = `${host}/academic-procedures/api/hod/approved/?role=hod`;
export const HOD_APPROVE_URL        = id => `${host}/academic-procedures/api/hod/approve/${id}/`;

// Faculty
export const FAC_ASSIGNMENTS_URL    = `${host}/academic-procedures/api/faculty/assignments/?role=faculty`;
export const FAC_PENDING_URL        = `${host}/academic-procedures/api/faculty/pending/?role=faculty`;
export const FAC_APPROVED_URL       = `${host}/academic-procedures/api/faculty/approved/?role=faculty`;
export const FAC_APPROVE_URL        = id => `${host}/academic-procedures/api/faculty/approve/${id}/`;

// TA
export const TA_STIPENDS_URL        = `${host}/academic-procedures/api/ta/stipends/?role=ta`;

// Aux
export const TA_LIST_URL            = `${host}/academic-procedures/api/tas/`;
export const FACULTY_LIST_URL       = `${host}/academic-procedures/api/faculties/`;



export const studentRegisteredSlotsRoute = `${host}/academic-procedures/api/stu/registered-slots/`;
export const studentBatchCreateRoute     = `${host}/academic-procedures/api/stu/batch-create/`;
export const studentListRequestsRoute    = `${host}/academic-procedures/api/stu/replacement-requests/`;

export const adminListRequestsRoute       = `${host}/academic-procedures/api/acad/replacement-requests/`;
export const allotReplacementCoursesRoute = `${host}/academic-procedures/api/acad/change-requests/allocate_all/`;


export const studentDropRegistrationsRoute = `${host}/academic-procedures/api/stu/registrations_drop/`;
export const studentDropCourseRoute     = `${host}/academic-procedures/api/stu/drop-course/`;

export const StudentSearchRoute     = `${host}/academic-procedures/api/acad/student-search/`;

export const studentQuestionsRoute = `${host}/academic-procedures/api/stu/feedback_questions/`;
export const studentSubmitRoute  = `${host}/academic-procedures/api/stu/feedback_submit/`;

export const instCoursesRoute  = `${host}/academic-procedures/api/inst/courses/`;
export const instAllStatsRoute  = `${host}/academic-procedures/api/inst/stats/all/`;

export const adminCoursesRoute    = `${host}/academic-procedures/api/acad/feedback_courses/`;
export const adminAllStatsRoute = `${host}/academic-procedures/api/acad/stats/all/`;

export const listBatchesRoute   = `${host}/academic-procedures/api/acad/batch_change/batches/`;
export const listStudentsRoute  = `${host}/academic-procedures/api/acad/batch_change/students/`;
export const applyBatchRoute    = `${host}/academic-procedures/api/acad/batch_change/apply/`;


export const listStudentsPromoteRoute = `${host}/academic-procedures/api/acad/promote/students/`;
export const applyPromoteRoute = `${host}/academic-procedures/api/acad/promote/apply/`;
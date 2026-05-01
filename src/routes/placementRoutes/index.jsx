import { host } from '../globalRoutes';

// Student
export const STU_DASHBOARD_URL       = `${host}/placement-cell/api/stu/dashboard/`;
export const STU_JOBS_URL            = `${host}/placement-cell/api/stu/jobs/`;
export const STU_JOB_DETAIL_URL      = (id) => `${host}/placement-cell/api/stu/jobs/${id}/`;
export const STU_JOB_APPLY_URL       = (id) => `${host}/placement-cell/api/stu/jobs/${id}/apply/`;
export const STU_APPLICATIONS_URL    = `${host}/placement-cell/api/stu/applications/`;
export const STU_WITHDRAW_URL        = (id) => `${host}/placement-cell/api/stu/applications/${id}/withdraw/`;
export const STU_PROFILE_URL         = `${host}/placement-cell/api/stu/profile/`;

// Placement Officer
export const OFC_COMPANIES_URL       = `${host}/placement-cell/api/officer/companies/`;
export const OFC_COMPANY_URL         = (id) => `${host}/placement-cell/api/officer/companies/${id}/`;
export const OFC_JOBS_URL            = `${host}/placement-cell/api/officer/jobs/`;
export const OFC_JOB_URL             = (id) => `${host}/placement-cell/api/officer/jobs/${id}/`;
export const OFC_JOB_TOGGLE_URL      = (id) => `${host}/placement-cell/api/officer/jobs/${id}/toggle/`;
export const OFC_APPLICANTS_URL      = (id) => `${host}/placement-cell/api/officer/jobs/${id}/applicants/`;
export const OFC_APP_STATUS_URL      = (id) => `${host}/placement-cell/api/officer/applications/${id}/status/`;
export const OFC_BULK_STATUS_URL     = `${host}/placement-cell/api/officer/applications/bulk-status/`;
export const OFC_BATCHES_URL           = `${host}/placement-cell/api/officer/batches/`;
export const OFC_STUDENTS_URL          = (batchId) => `${host}/placement-cell/api/officer/students/?batch_id=${batchId}`;
export const OFC_STUDENT_UPDATE_URL    = `${host}/placement-cell/api/officer/students/update/`;
export const OFC_EXPORT_URL          = `${host}/placement-cell/api/officer/export/`;
export const OFC_ANNOUNCEMENTS_URL   = `${host}/placement-cell/api/officer/announcements/`;
export const OFC_ANNOUNCEMENT_URL    = (id) => `${host}/placement-cell/api/officer/announcements/${id}/`;
export const OFC_STATS_URL           = `${host}/placement-cell/api/officer/statistics/`;
export const OFC_STATS_REFRESH_URL   = `${host}/placement-cell/api/officer/statistics/refresh/`;
export const OFC_OFFCAMPUS_URL       = `${host}/placement-cell/api/officer/offcampus/`;
export const OFC_OFFCAMPUS_ITEM_URL  = (id) => `${host}/placement-cell/api/officer/offcampus/${id}/`;

// Placement Chairman
export const CHM_STATS_URL           = `${host}/placement-cell/api/chairman/statistics/`;
export const CHM_BATCHES_URL         = `${host}/placement-cell/api/chairman/batches/`;
export const CHM_STUDENTS_URL        = (batchId) => `${host}/placement-cell/api/chairman/students/?batch_id=${batchId}`;
export const CHM_EXPORT_URL          = `${host}/placement-cell/api/chairman/export/`;

// Dean / Faculty
export const DEAN_BATCHES_URL        = `${host}/placement-cell/api/dean/batches/`;
export const DEAN_STATS_URL          = `${host}/placement-cell/api/dean/statistics/`;
export const DEAN_ANNOUNCEMENTS_URL  = `${host}/placement-cell/api/dean/announcements/`;

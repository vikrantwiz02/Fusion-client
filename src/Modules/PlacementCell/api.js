import {
  STU_DASHBOARD_URL, STU_JOBS_URL, STU_JOB_DETAIL_URL, STU_JOB_APPLY_URL,
  STU_APPLICATIONS_URL, STU_WITHDRAW_URL, STU_PROFILE_URL,
  OFC_COMPANIES_URL, OFC_COMPANY_URL, OFC_JOBS_URL, OFC_JOB_URL,
  OFC_JOB_TOGGLE_URL, OFC_APPLICANTS_URL, OFC_APP_STATUS_URL,
  OFC_BULK_STATUS_URL, OFC_BATCHES_URL, OFC_STUDENTS_URL, OFC_STUDENT_UPDATE_URL, OFC_EXPORT_URL,
  OFC_ANNOUNCEMENTS_URL, OFC_ANNOUNCEMENT_URL,
  OFC_STATS_URL, OFC_STATS_REFRESH_URL, OFC_OFFCAMPUS_URL, OFC_OFFCAMPUS_ITEM_URL,
  CHM_STATS_URL, CHM_BATCHES_URL, CHM_STUDENTS_URL, CHM_EXPORT_URL,
  DEAN_BATCHES_URL, DEAN_STATS_URL, DEAN_ANNOUNCEMENTS_URL,
} from '../../routes/placementRoutes';

const authHeaders = () => ({
  Authorization: `Token ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});

const handleResponse = async (res) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // DRF field errors: {field: ["msg"]} — flatten to readable string
    const msg = body.error || body.detail
      || Object.entries(body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
      || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
};

// ── Student ──────────────────────────────────────────────────────────────────
export const fetchDashboard   = () => fetch(STU_DASHBOARD_URL,   { headers: authHeaders() }).then(handleResponse);
export const fetchActiveJobs  = () => fetch(STU_JOBS_URL,         { headers: authHeaders() }).then(handleResponse);
export const fetchJobDetail   = (id) => fetch(STU_JOB_DETAIL_URL(id), { headers: authHeaders() }).then(handleResponse);
export const applyToJob       = (id) => fetch(STU_JOB_APPLY_URL(id), { method: 'POST', headers: authHeaders() }).then(handleResponse);
export const fetchApplications = () => fetch(STU_APPLICATIONS_URL, { headers: authHeaders() }).then(handleResponse);
export const withdrawApplication = (id) => fetch(STU_WITHDRAW_URL(id), { method: 'POST', headers: authHeaders() }).then(handleResponse);
export const fetchStudentProfile = () => fetch(STU_PROFILE_URL, { headers: authHeaders() }).then(handleResponse);
export const updateStudentProfile = (data) => fetch(STU_PROFILE_URL, {
  method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
}).then(handleResponse);

// ── Officer ───────────────────────────────────────────────────────────────────
export const fetchCompanies   = () => fetch(OFC_COMPANIES_URL, { headers: authHeaders() }).then(handleResponse);
export const createCompany    = (data) => fetch(OFC_COMPANIES_URL, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateCompany    = (id, data) => fetch(OFC_COMPANY_URL(id), { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteCompany    = (id) => fetch(OFC_COMPANY_URL(id), { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

export const fetchAllJobs     = () => fetch(OFC_JOBS_URL, { headers: authHeaders() }).then(handleResponse);
export const createJobPost    = (data) => fetch(OFC_JOBS_URL, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateJobPost    = (id, data) => fetch(OFC_JOB_URL(id), { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const toggleJobPost    = (id) => fetch(OFC_JOB_TOGGLE_URL(id), { method: 'POST', headers: authHeaders() }).then(handleResponse);

export const fetchApplicants  = (jobId) => fetch(OFC_APPLICANTS_URL(jobId), { headers: authHeaders() }).then(handleResponse);
export const updateAppStatus  = (appId, newStatus) => fetch(OFC_APP_STATUS_URL(appId), {
  method: 'POST', headers: authHeaders(), body: JSON.stringify({ status: newStatus }),
}).then(handleResponse);
export const bulkUpdateStatus = (ids, newStatus) => fetch(OFC_BULK_STATUS_URL, {
  method: 'POST', headers: authHeaders(), body: JSON.stringify({ ids, status: newStatus }),
}).then(handleResponse);

export const fetchBatches      = () => fetch(OFC_BATCHES_URL, { headers: authHeaders() }).then(handleResponse);
export const fetchAllStudents  = (batchId) => fetch(OFC_STUDENTS_URL(batchId), { headers: authHeaders() }).then(handleResponse);
export const updateStudentByOfficer = (data) => fetch(OFC_STUDENT_UPDATE_URL, {
  method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
}).then(handleResponse);
export const refreshStats      = (batchYear) => fetch(OFC_STATS_REFRESH_URL, {
  method: 'POST', headers: authHeaders(), body: JSON.stringify({ batch_year: batchYear }),
}).then(handleResponse);

export const fetchOfficerAnnouncements = () => fetch(OFC_ANNOUNCEMENTS_URL, { headers: authHeaders() }).then(handleResponse);
export const createAnnouncement = (data) => fetch(OFC_ANNOUNCEMENTS_URL, {
  method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
}).then(handleResponse);
export const deleteAnnouncement = (id) => fetch(OFC_ANNOUNCEMENT_URL(id), { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

export const exportPlacementData = () => {
  const token = localStorage.getItem('authToken');
  return fetch(OFC_EXPORT_URL, { headers: { Authorization: `Token ${token}` } });
};

export const fetchOfficerStats = (batchId) =>
  fetch(`${OFC_STATS_URL}${batchId ? `?batch_id=${batchId}` : ''}`, { headers: authHeaders() }).then(handleResponse);

export const fetchOffCampus    = () => fetch(OFC_OFFCAMPUS_URL, { headers: authHeaders() }).then(handleResponse);
export const addOffCampus      = (data) => fetch(OFC_OFFCAMPUS_URL, {
  method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
}).then(handleResponse);
export const deleteOffCampus   = (id) => fetch(OFC_OFFCAMPUS_ITEM_URL(id), { method: 'DELETE', headers: authHeaders() }).then(handleResponse);

// ── Chairman ──────────────────────────────────────────────────────────────────
export const fetchChairmanStats    = (batchId) =>
  fetch(`${CHM_STATS_URL}${batchId ? `?batch_id=${batchId}` : ''}`, { headers: authHeaders() }).then(handleResponse);
export const fetchChairmanBatches  = () => fetch(CHM_BATCHES_URL,  { headers: authHeaders() }).then(handleResponse);
export const fetchChairmanStudents = (batchId) => fetch(CHM_STUDENTS_URL(batchId), { headers: authHeaders() }).then(handleResponse);
export const exportChairmanData    = () => {
  const token = localStorage.getItem('authToken');
  return fetch(CHM_EXPORT_URL, { headers: { Authorization: `Token ${token}` } });
};

// ── Dean ──────────────────────────────────────────────────────────────────────
export const fetchDeanBatches       = () => fetch(DEAN_BATCHES_URL,       { headers: authHeaders() }).then(handleResponse);
export const fetchDeanStats         = (batchId) =>
  fetch(`${DEAN_STATS_URL}${batchId ? `?batch_id=${batchId}` : ''}`, { headers: authHeaders() }).then(handleResponse);
export const fetchDeanAnnouncements = () => fetch(DEAN_ANNOUNCEMENTS_URL, { headers: authHeaders() }).then(handleResponse);

// src/api.js
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// FIX: Check both storages — Login.js uses sessionStorage when
// "Remember Me" is unchecked. The old code only read localStorage,
// causing every API call to send no token → 401 on all requests.
const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────
export const login          = (creds)        => request('POST', '/auth/login', creds);
export const register       = (data)         => request('POST', '/auth/register', data);
export const changePassword = (data)         => request('POST', '/auth/change-password', data);
export const getMe          = ()             => request('GET',  '/auth/me');

// ── Companies ────────────────────────────────────────────────────
export const getCompanies   = ()             => request('GET',    '/companies');
export const getCompany     = (id)           => request('GET',    `/companies/${id}`);
export const createCompany  = (data)         => request('POST',   '/companies', data);
export const updateCompany  = (id, data)     => request('PUT',    `/companies/${id}`, data);
export const deleteCompany  = (id)           => request('DELETE', `/companies/${id}`);
export const applyForSlot   = (id)           => request('POST',   `/companies/${id}/apply`);

// ── Students ─────────────────────────────────────────────────────
export const getStudents          = ()       => request('GET',  '/students');
export const getStudent           = (id)     => request('GET',  `/students/${id}`);
export const assignStudent        = (id, d)  => request('PUT',    `/students/${id}/assign`, d);
export const unassignStudent      = (id)     => request('DELETE', `/students/${id}/assign`);
export const updateStudent        = (id, d)  => request('PUT',  `/students/${id}`, d);
export const resetStudentPassword = (id)     => request('POST', `/students/${id}/reset-password`);
export const revokePlacement      = (id)     => request('PUT',  `/students/${id}/revoke`);
export const deleteStudent        = (id)     => request('DELETE',`/students/${id}`);

// ── Placements ───────────────────────────────────────────────────
export const submitPlacementRequest = (data) => request('POST', '/placements', data);
export const getPlacementRequests   = (params) => {
  const qs = params?.status ? `?status=${params.status}` : '';
  return request('GET', `/placements${qs}`);
};
export const approvePlacement       = (id,d) => request('PUT',  `/placements/${id}/approve`, d);
export const declinePlacement       = (id)   => request('PUT',  `/placements/${id}/decline`);

// ── Logs ─────────────────────────────────────────────────────────
export const submitLog        = (data)       => request('POST', '/logs', data);
export const getLogs          = ()           => request('GET',  '/logs');
export const getMyLogs        = ()           => request('GET',  '/logs/me');
export const getPendingLogs   = ()           => request('GET',  '/logs/pending');
export const getStudentLogs   = (studentId)  => request('GET',  `/logs/student/${studentId}`);
export const approveLog       = (id, note)   => request('PUT',  `/logs/${id}/approve`, { note: note || '' });
export const rejectLog        = (id, note)   => request('PUT',  `/logs/${id}/reject`,  { note: note || '' });

// ── Grades ───────────────────────────────────────────────────────
export const getGrades       = ()            => request('GET',  '/grades');
export const getMyGrades     = ()            => request('GET',  '/grades/mine');
export const submitGrade     = (data)        => request('POST', '/grades', data);
export const updateGrade     = (id, data)    => request('PUT',  `/grades/${id}`, data);
export const getStudentGrade = (studentId)   => request('GET',  `/grades/student/${studentId}`);
// Batch stats: 2 aggregations server-side instead of 2N individual requests.
// Pass an array of student IDs and the configured totalWeeks.
export const getStudentStats = (ids, totalWeeks = 6) =>
  request('GET', `/students/stats?ids=${ids.join(',')}&totalWeeks=${totalWeeks}`);

// ── Supervisors / Academic ────────────────────────────────────────
export const getSupervisors    = ()          => request('GET',    '/supervisors');
export const updateSupervisor  = (id, data)  => request('PUT',    `/supervisors/${id}`, data);
export const deleteSupervisor  = (id)        => request('DELETE', `/supervisors/${id}`);
export const assignSupervisor  = (id, data)  => request('PUT',    `/supervisors/${id}/assign`, data);

// ── Documents / Letters ──────────────────────────────────────────
export const getDocuments       = (params)   => {
  const parts = [];
  if (params?.studentId) parts.push(`studentId=${params.studentId}`);
  if (params?.type)      parts.push(`type=${params.type}`);
  const qs = parts.length ? `?${parts.join('&')}` : '';
  return request('GET', `/documents${qs}`);
};
export const getPublicDocuments = ()         => request('GET',    '/documents?public=true');
export const downloadDocument   = (id)       => request('GET',    `/documents/${id}/download`);
export const deleteDocument     = (id)       => request('DELETE', `/documents/${id}`);

// ── Notifications / Broadcast ─────────────────────────────────────
export const sendBroadcast    = (data)       => request('POST', '/broadcast', data);
export const getNotifications = ()          => request('GET',  '/notifications');

// ── Visits ───────────────────────────────────────────────────────
export const scheduleVisit  = (data)        => request('POST', '/visits', data);
export const getVisits      = ()            => request('GET',  '/visits');
export const updateVisit    = (id, data)    => request('PUT',  `/visits/${id}`, data);

// ── Settings ─────────────────────────────────────────────────────
export const getSettings       = ()         => request('GET',    '/settings');
export const updateSettings    = (data)     => request('PUT',    '/settings', data);
export const addDepartment     = (name)     => request('POST',   '/settings/departments', { name });
export const removeDepartment  = (name)     => request('DELETE', '/settings/departments', { name });

// ── File upload helper (used by FinalReport and AdminDocumentsTab) ────────
// FIX: Reads from both storages so sessionStorage sessions work too.
export const uploadFile = async (formData) => {
  const token = getToken();
  const BASE  = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const r = await fetch(`${BASE}/documents`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    formData,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || 'Upload failed');
  return data;
};

// ── Default export ────────────────────────────────────────────────
const api = {
  login, register, changePassword, getMe,
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany, applyForSlot,
  getStudents, getStudent, assignStudent, unassignStudent, updateStudent,
  resetStudentPassword, revokePlacement, deleteStudent,
  submitPlacementRequest, getPlacementRequests, approvePlacement, declinePlacement,
  submitLog, getLogs, getMyLogs, getPendingLogs, getStudentLogs, approveLog, rejectLog,
  getGrades, getMyGrades, submitGrade, updateGrade, getStudentGrade, getStudentStats,
  getSupervisors, assignSupervisor, updateSupervisor, deleteSupervisor,
  getDocuments, getPublicDocuments, downloadDocument, deleteDocument,
  sendBroadcast, getNotifications,
  scheduleVisit, getVisits, updateVisit,
  getSettings, updateSettings, addDepartment, removeDepartment,
  uploadFile,
};

export default api;
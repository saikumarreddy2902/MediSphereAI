import { api } from '@/lib/api';

/**
 * MediSphere AI — Centralized Service Layer
 * Encapsulates all backend REST API endpoints with graceful fallback handling.
 */

// ─── AUTHENTICATION SERVICES ──────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  roles: string[];
}

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post<LoginResponse>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
}

export async function registerApi(data: {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
  department_id?: string;
}): Promise<LoginResponse & { message: string; user: any }> {
  const response = await api.post('/auth/register', data);
  return response.data;
}

export async function getMeApi() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function updateProfileApi(data: {
  full_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}) {
  const response = await api.put('/auth/me', data);
  return response.data;
}

export async function refreshTokenApi() {
  const response = await api.post('/auth/refresh');
  return response.data;
}

export async function logoutApi() {
  const response = await api.post('/auth/logout');
  return response.data;
}

// ─── DASHBOARD SERVICES ───────────────────────────────────────────────────────

export async function getDashboardOverviewApi() {
  const response = await api.get('/dashboard/overview');
  return response.data;
}

export async function getKPIsApi() {
  const response = await api.get('/dashboard/kpis');
  return response.data;
}

export async function getPatientFlowApi() {
  const response = await api.get('/dashboard/patient-flow');
  return response.data;
}

export async function getRevenueApi() {
  const response = await api.get('/dashboard/revenue');
  return response.data;
}

export async function getDeptPerformanceApi() {
  const response = await api.get('/dashboard/department-performance');
  return response.data;
}

// ─── PATIENTS SERVICES ────────────────────────────────────────────────────────

export async function getPatientsApi(skip = 0, limit = 50) {
  const response = await api.get('/patients/', { params: { skip, limit } });
  return response.data;
}

export async function createPatientApi(data: {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
  address: string;
  blood_group: string;
  email?: string;
  medical_history?: string[];
  allergies?: string[];
}) {
  const response = await api.post('/patients/', data);
  return response.data;
}

export async function getPatientByIdApi(patientId: string) {
  const response = await api.get(`/patients/${patientId}`);
  return response.data;
}

export async function searchPatientsApi(query: string) {
  const response = await api.get('/patients/search', { params: { query } });
  return response.data;
}

// ─── APPOINTMENTS SERVICES ────────────────────────────────────────────────────

export async function getAppointmentsApi(params?: {
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const response = await api.get('/appointments/', { params });
  return response.data;
}

export async function createAppointmentApi(data: {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_type: string;
  reason?: string;
}) {
  const response = await api.post('/appointments/', data);
  return response.data;
}

export async function updateAppointmentApi(id: string, data: Partial<{
  status: string;
  notes: string;
  appointment_date: string;
}>) {
  const response = await api.put(`/appointments/${id}`, data);
  return response.data;
}

export async function reassignAppointmentApi(id: string, data: {
  department?: string;
  doctor_name?: string;
  doctor_id?: string;
  doctor_specialty?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  reason?: string;
}) {
  const response = await api.post(`/appointments/${id}/reassign`, data);
  return response.data;
}

export async function cancelAppointmentApi(id: string) {
  const response = await api.post(`/appointments/${id}/cancel`);
  return response.data;
}

export async function agentBookAppointmentApi(data: {
  patient_name: string;
  patient_id?: string;
  department: string;
  appointment_date: string;
  time_window?: string;
  reason?: string;
  appointment_type?: string;
}) {
  const response = await api.post('/appointments/agent-book', data);
  return response.data;
}

export async function getDoctorAvailabilityApi(department: string, dateStr?: string) {
  const response = await api.get('/appointments/doctors-availability', {
    params: { department, date_str: dateStr }
  });
  return response.data;
}

export async function getAvailableDepartmentsApi() {
  const response = await api.get('/appointments/departments');
  return response.data;
}

export async function lookupPatientApi(patientId: string) {
  const response = await api.get(`/appointments/patient-lookup/${patientId}`);
  return response.data;
}

export async function agentBookMultiDepartmentsApi(data: {
  patient_name?: string;
  patient_id: string;
  departments: string[];
  appointment_date: string;
  time_window?: string;
  reason?: string;
  appointment_type?: string;
}) {
  const response = await api.post('/appointments/agent-book-multi', data);
  return response.data;
}

export async function getAppointmentStatsApi() {
  const response = await api.get('/appointments/stats');
  return response.data;
}

// ─── BEDS SERVICES ────────────────────────────────────────────────────────────

export async function getBedsApi() {
  const response = await api.get('/beds/');
  return response.data;
}

export async function getBedSummaryApi() {
  const response = await api.get('/beds/summary');
  return response.data;
}

export async function assignBedApi(bedId: string, data: { patient_id: string }) {
  const response = await api.post(`/beds/${bedId}/assign`, data);
  return response.data;
}

export async function agentAutoAllocateBedApi(data?: {
  patient_id?: string;
  patient_name?: string;
  acuity_level?: string;
  preferred_ward?: string;
  needs_ventilator?: boolean;
  needs_oxygen?: boolean;
  needs_isolation?: boolean;
}) {
  const response = await api.post('/beds/agent-auto-allocate', data || {});
  return response.data;
}

export async function releaseBedApi(bedId: string) {
  const response = await api.post(`/beds/${bedId}/release`);
  return response.data;
}

// ─── EMERGENCY SERVICES ───────────────────────────────────────────────────────

export async function getEmergencyCasesApi(params?: { status?: string; priority?: string }) {
  const response = await api.get('/emergency/', { params });
  return response.data;
}

export async function createEmergencyCaseApi(data: {
  patient_name: string;
  chief_complaint: string;
  triage_level: number;
  vital_signs?: Record<string, any>;
}) {
  const response = await api.post('/emergency/', data);
  return response.data;
}

export async function updateEmergencyCaseApi(id: string, data: Partial<{
  outcome: string;
  assigned_bed_id: string;
  notes: string;
}>) {
  const response = await api.put(`/emergency/${id}`, data);
  return response.data;
}

// ─── STAFF SERVICES ───────────────────────────────────────────────────────────

export async function getStaffApi(params?: { department?: string; role?: string }) {
  const response = await api.get('/staff/', { params });
  return response.data;
}

export async function getStaffRosterSummaryApi() {
  const response = await api.get('/staff/roster/summary');
  return response.data;
}

// ─── PHARMACY SERVICES ────────────────────────────────────────────────────────

export async function getPharmacyInventoryApi(params?: {
  category?: string;
  low_stock?: boolean;
  skip?: number;
  limit?: number;
}) {
  const response = await api.get('/pharmacy/inventory', { params });
  return response.data;
}

export async function getPharmacyStatsApi() {
  const response = await api.get('/pharmacy/stats');
  return response.data;
}

export async function getLowStockAlertsApi() {
  const response = await api.get('/pharmacy/low-stock');
  return response.data;
}

// ─── LABORATORY SERVICES ──────────────────────────────────────────────────────

export async function getLabOrdersApi(params?: {
  status?: string;
  priority?: string;
  skip?: number;
  limit?: number;
}) {
  const response = await api.get('/laboratory/orders', { params });
  return response.data;
}

export async function getLabStatsApi() {
  const response = await api.get('/laboratory/stats');
  return response.data;
}

export async function getCriticalLabOrdersApi() {
  const response = await api.get('/laboratory/critical');
  return response.data;
}

export async function getLabTestCatalogApi() {
  const response = await api.get('/laboratory/tests');
  return response.data;
}

export async function createLabOrderApi(data: {
  patient_id: string;
  patient_name: string;
  test_name: string;
  test_code: string;
  category: string;
  priority?: string;
  cost: number;
  ordered_by: string;
}) {
  const response = await api.post('/laboratory/orders', data);
  return response.data;
}

export async function updateLabOrderApi(orderId: string, data: Partial<{
  status: string;
  priority: string;
  is_critical: boolean;
  result_available: boolean;
  result_value: string;
  result_notes: string;
}>) {
  const response = await api.put(`/laboratory/orders/${orderId}`, data);
  return response.data;
}

// ─── EQUIPMENT SERVICES ───────────────────────────────────────────────────────

export async function getEquipmentApi(params?: {
  department_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) {
  const response = await api.get('/equipment/', { params });
  return response.data;
}

export async function updateEquipmentApi(id: string, data: Partial<{
  operational_status: string;
  next_maintenance_date: string;
  warranty_expiry: string;
}>) {
  const response = await api.put(`/equipment/${id}`, data);
  return response.data;
}

export async function getEquipmentStatsApi() {
  const response = await api.get('/equipment/stats');
  return response.data;
}

// ─── BILLING SERVICES ─────────────────────────────────────────────────────────

export async function getBillsApi(params?: {
  patient_id?: string;
  payment_status?: string;
  skip?: number;
  limit?: number;
}) {
  const response = await api.get('/billing/', { params });
  return response.data;
}

export async function getBillingStatsApi() {
  const response = await api.get('/billing/stats');
  return response.data;
}

export async function createBillApi(data: {
  patient_id: string;
  items: Array<{ description: string; quantity: number; unit_price: number }>;
  insurance_claim_id?: string;
}) {
  const response = await api.post('/billing/', data);
  return response.data;
}

export async function updateBillPaymentApi(id: string, data: {
  payment_status: string;
  amount_paid?: number;
  payment_method?: string;
}) {
  const response = await api.patch(`/billing/${id}/payment`, data);
  return response.data;
}

// ─── INSURANCE SERVICES ───────────────────────────────────────────────────────

export async function getInsuranceClaimsApi(params?: {
  status?: string;
  patient_id?: string;
  skip?: number;
  limit?: number;
}) {
  const response = await api.get('/insurance/', { params });
  return response.data;
}

export async function createInsuranceClaimApi(data: {
  patient_id: string;
  provider_name: string;
  policy_number: string;
  claim_amount: number;
  diagnosis_code?: string;
}) {
  const response = await api.post('/insurance/', data);
  return response.data;
}

export async function updateInsuranceClaimApi(id: string, data: Partial<{
  claim_status: string;
  approved_amount: number;
  rejection_reason: string;
}>) {
  const response = await api.put(`/insurance/${id}`, data);
  return response.data;
}

export async function getInsuranceStatsApi() {
  const response = await api.get('/insurance/stats');
  return response.data;
}

// ─── PRESCRIPTIONS SERVICES ───────────────────────────────────────────────────

export async function getPrescriptionsApi(params?: {
  patient_id?: string;
  status?: string;
  limit?: number;
}) {
  const response = await api.get('/prescriptions/', { params });
  return response.data;
}

export async function getPrescriptionByIdApi(id: string) {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data;
}

export async function createPrescriptionApi(data: {
  patient_id: string;
  medications: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration_days: number;
    route?: string;
  }>;
  diagnosis?: string;
  notes?: string;
  is_renewable?: boolean;
  valid_days?: number;
}) {
  const response = await api.post('/prescriptions/', data);
  return response.data;
}

export async function dispensePrescriptionApi(id: string) {
  const response = await api.post(`/prescriptions/${id}/dispense`);
  return response.data;
}

export async function renewPrescriptionApi(id: string, days?: number) {
  const response = await api.post(`/prescriptions/${id}/renew`, { days });
  return response.data;
}

export async function cancelPrescriptionApi(id: string, reason?: string) {
  const response = await api.post(`/prescriptions/${id}/cancel`, null, {
    params: reason ? { reason } : {},
  });
  return response.data;
}

export async function validateMedicationsApi(data: {
  medications: Array<{ medicine_name: string; dosage: string; frequency: string; duration_days: number }>;
  patient_allergies?: string[];
}) {
  const response = await api.post('/prescriptions/validate', data);
  return response.data;
}

export async function getPrescriptionAlertsApi() {
  const response = await api.get('/prescriptions/alerts');
  return response.data;
}

// ─── MEDICAL RECORDS SERVICES ─────────────────────────────────────────────────

export async function getAllMedicalRecordsApi(params?: {
  record_type?: string;
  patient_id?: string;
  limit?: number;
  active_only?: boolean;
}) {
  const response = await api.get('/medical-records/', { params });
  return response.data;
}

export async function getPatientMedicalRecordsApi(patientId: string, params?: {
  record_type?: string;
  active_only?: boolean;
}) {
  const response = await api.get(`/patients/${patientId}/records`, { params });
  return response.data;
}

export async function createMedicalRecordApi(patientId: string, data: {
  record_type: string;
  title: string;
  description: string;
  icd_code?: string;
  severity?: string;
  date_of_record: string;
}) {
  const response = await api.post(`/patients/${patientId}/records`, data);
  return response.data;
}

export async function deactivateMedicalRecordApi(patientId: string, recordId: string) {
  const response = await api.delete(`/patients/${patientId}/records/${recordId}`);
  return response.data;
}

// ─── ANALYTICS SERVICES ───────────────────────────────────────────────────────

export async function getAnalyticsSummaryApi() {
  const response = await api.get('/analytics/summary');
  return response.data;
}

export async function getKpiHistoryApi(metric: string, days = 30) {
  const response = await api.get('/analytics/kpis/history', { params: { metric, days } });
  return response.data;
}

export async function getPredictionsApi() {
  const response = await api.get('/analytics/predictions');
  return response.data;
}

export async function getHourlyFlowApi() {
  const response = await api.get('/analytics/patient-flow/hourly');
  return response.data;
}

export async function getDailyRevenueApi() {
  const response = await api.get('/analytics/revenue/daily');
  return response.data;
}

export async function getDepartmentAnalyticsApi() {
  const response = await api.get('/analytics/departments');
  return response.data;
}

export async function getPrescriptionAnalyticsApi() {
  const response = await api.get('/analytics/prescriptions');
  return response.data;
}

// ─── NOTIFICATIONS SERVICES ───────────────────────────────────────────────────

export async function getNotificationsApi(params?: { limit?: number; unread_only?: boolean }) {
  const response = await api.get('/notifications/', { params });
  return response.data;
}

export async function markNotificationReadApi(id: string) {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsReadApi() {
  const response = await api.post('/notifications/mark-all-read');
  return response.data;
}

// ─── AI AGENT & RECOMMENDATION SERVICES ───────────────────────────────────────

export async function getRecommendationsApi(params?: {
  priority?: string;
  category?: string;
  acknowledged?: boolean;
}) {
  const response = await api.get('/recommendations/', { params });
  return response.data;
}

export async function acknowledgeRecommendationApi(id: string) {
  const response = await api.patch(`/recommendations/${id}/acknowledge`);
  return response.data;
}

export async function getRecommendationStatsApi() {
  const response = await api.get('/recommendations/stats');
  return response.data;
}

export async function getAgentsStatusApi() {
  const response = await api.get('/agents/status');
  return response.data;
}

export async function triggerAgentApi(agentKey: string) {
  const response = await api.post(`/agents/${agentKey}/trigger`);
  return response.data;
}

// ─── DEPARTMENT WORK QUEUE SERVICES ──────────────────────────────────────────

export async function getAllDepartmentQueuesSummaryApi() {
  const response = await api.get('/work-queues/departments');
  return response.data;
}

export async function getDepartmentWorkQueueApi(departmentName: string, priority?: string) {
  const response = await api.get(`/work-queues/department/${encodeURIComponent(departmentName)}`, {
    params: priority ? { priority } : undefined
  });
  return response.data;
}

export async function executeQueueActionApi(payload: {
  department: string;
  action_type: string;
  target_id: string;
  notes?: string;
}) {
  const response = await api.post('/work-queues/action', payload);
  return response.data;
}

// ─── DEDICATED PATIENT PORTAL SERVICES ──────────────────────────────────────

export async function getPatientPortalSummaryApi(patientId: string = 'P-0041') {
  const response = await api.get(`/patients/${patientId}/portal-summary`);
  return response.data;
}

export async function submitPatientRefillRequestApi(data: {
  patient_id: string;
  prescription_id: string;
  medication_name: string;
  reason?: string;
}) {
  const response = await api.post('/patients/portal/refill-request', data);
  return response.data;
}

export async function sendPatientCareTeamMessageApi(data: {
  patient_id: string;
  department: string;
  doctor_name?: string;
  message: string;
}) {
  const response = await api.post('/patients/portal/messages', data);
  return response.data;
}



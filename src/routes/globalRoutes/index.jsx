// Same-origin in production (VITE_API_HOST="" in .env.production → "/api/...",
// proxied to gunicorn by nginx). Falls back to local gunicorn for dev.
export const host = import.meta.env.VITE_API_HOST ?? "http://127.0.0.1:8000";
// Public emailed links (external examiners) reach the same backend base as the app.
export const dynamicApiHost = host;
export const authRoute = `${host}/api/auth/me`;
export const loginRoute = `${host}/api/auth/login/`;
export const mediaRoute = `${host}/media/`;

// First-login student profile completion
export const profileCompletionRoute = `${host}/programme_curriculum/api/student/profile_completion/`;
export const profileCompletionSubmitRoute = `${host}/programme_curriculum/api/student/profile_completion/submit/`;
export const studentProfileImageRoute = `${host}/programme_curriculum/api/student/profile_image/`;
export const studentProfileUpdateRoute = `${host}/programme_curriculum/api/student/profile_update/`;

// Scholarship module: department-staff assistantship sheet
export const assistantshipSheetRoute = `${host}/spacs/api/assistantship/sheet/`;
export const assistantshipSaveRoute = `${host}/spacs/api/assistantship/save/`;
export const assistantshipSignatoryRoute = `${host}/spacs/api/assistantship/signatory/`;
export const assistantshipRemoveRoute = `${host}/spacs/api/assistantship/remove/`;

// OTP-based password reset
export const passwordResetSendOtp = `${host}/api/auth/password-reset/send-otp/`;
export const passwordResetVerifyOtp = `${host}/api/auth/password-reset/verify-otp/`;
export const passwordResetReset = `${host}/api/auth/password-reset/reset/`;

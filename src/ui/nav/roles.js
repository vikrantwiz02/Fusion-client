export const ADMIN_ROLES = ["acadadmin", "studentacadadmin"];

// programme-level admins; used only where the backend scopes its data
export const PROGRAMME_ADMIN_ROLES = ["Acad UG", "Acad PG", "Acad Ph.D."];

export const SCOPED_ADMIN_ROLES = [...ADMIN_ROLES, ...PROGRAMME_ADMIN_ROLES];

const PROGRAMMES_BY_ROLE = {
  "Acad UG": ["UG"],
  "Acad PG": ["PG"],
  "Acad Ph.D.": ["PHD"],
};

export function programmesForRole(role) {
  return PROGRAMMES_BY_ROLE[role] ?? null;
}

export function allowedProgrammeChoices(role, choices) {
  const allowed = programmesForRole(role);
  if (!allowed) return choices;
  return choices.filter((choice) => allowed.includes(choice.value));
}
export const FACULTY_ROLES = [
  "faculty",
  "Professor",
  "Associate Professor",
  "Assistant Professor",
];
export const STUDENT_ROLES = ["student"];

// One per discipline, e.g. "CSE Staff". They get the assistantship sheet and
// nothing else.
export const DEPARTMENT_STAFF_SUFFIX = " Staff";

export function isDepartmentStaff(role) {
  return Boolean(role) && role.endsWith(DEPARTMENT_STAFF_SUFFIX);
}
export const DEAN_ROLES = ["Dean Academic"];
export const DIRECTOR_ROLES = ["Director"];
export const HOD_ROLES = ["HOD*"];

export function matchesRole(role, allowed) {
  if (!role || !allowed?.length) return false;
  return allowed.some((a) =>
    a.endsWith("*") ? role.startsWith(a.slice(0, -1)) : a === role,
  );
}

export function pagesForRole(pages, role, flags = {}) {
  return pages.filter((p) => {
    if (!matchesRole(role, p.roles)) return false;
    return p.when ? p.when(flags) : true;
  });
}

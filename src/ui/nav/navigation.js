import { ACADEMIC_BASE, ACADEMIC_PAGES } from "../../Modules/Academic/pages";
import {
  CURRICULUM_BASE,
  CURRICULUM_PAGES,
} from "../../Modules/Program_curriculum/pages";
import {
  EXAMINATION_BASE,
  EXAMINATION_PAGES,
} from "../../Modules/Examination/pages";
import { THESIS_BASE, THESIS_PAGES } from "../../Modules/ThesisResearch/pages";
import {
  FPS_BASE,
  FPS_PAGES,
} from "../../Modules/facultyProfessionalProfile/pages";
import {
  CERTIFICATES_BASE,
  CERTIFICATE_PAGES,
} from "../../Modules/Certificates/pages";
import { isDepartmentStaff, pagesForRole, STUDENT_ROLES } from "./roles";

const GROUP_ICONS = {
  Registration: "ClipboardText",
  "Course Changes": "ArrowsLeftRight",
  "Student Records": "Users",
  "Calendar & Feedback": "CalendarBlank",
  Assignments: "UserPlus",
  Proposals: "Signature",
  "File Tracking": "FolderOpen",
  Grades: "Stamp",
  Results: "Scroll",
  Thesis: "BookOpen",
  Milestones: "Checks",
  Supervision: "UserFocus",
  Seminars: "ChatCircleDots",
  Examiners: "Users",
  "Research Output": "Newspaper",
  Activities: "Megaphone",
  Personal: "IdentificationBadge",
};

const MODULE_SECTIONS = [
  {
    id: "course_registration",
    section: "Academics",
    base: ACADEMIC_BASE,
    pages: ACADEMIC_PAGES,
  },
  {
    id: "course_registration",
    section: "Certificate",
    base: CERTIFICATES_BASE,
    pages: CERTIFICATE_PAGES,
  },
  {
    id: "program_and_curriculum",
    section: "Program & Curriculum",
    base: CURRICULUM_BASE,
    pages: CURRICULUM_PAGES,
  },
  {
    id: "examinations",
    section: "Examination",
    base: EXAMINATION_BASE,
    pages: EXAMINATION_PAGES,
  },
  {
    id: "thesis_research",
    section: "Doctoral & PG Research",
    base: THESIS_BASE,
    pages: THESIS_PAGES,
  },
];

const STUDENT_SECTION_ORDER = [
  "course_registration",
  "examinations",
  "program_and_curriculum",
  "thesis_research",
];

const sectionsFor = (role) =>
  STUDENT_ROLES.includes(role)
    ? [...MODULE_SECTIONS].sort(
        (a, b) =>
          STUDENT_SECTION_ORDER.indexOf(a.id) -
          STUDENT_SECTION_ORDER.indexOf(b.id),
      )
    : MODULE_SECTIONS;

const OTHER_MODULES = [
  {
    id: "database",
    label: "Database",
    icon: "Database",
    to: "/database/view",
  },
];

const toLink = (base, page) => ({
  code: page.key,
  label: page.title,
  icon: page.icon,
  to: `${base}/${page.slug}`,
});

// Groups and ungrouped links keep the order their pages are declared in.
function itemsFor(section, base, pages) {
  const grouped = new Map();
  const order = [];

  pages.forEach((page) => {
    if (!page.group) {
      order.push({ link: toLink(base, page) });
      return;
    }
    if (!grouped.has(page.group)) {
      grouped.set(page.group, []);
      order.push({ group: page.group });
    }
    grouped.get(page.group).push(toLink(base, page));
  });

  return order.map(({ link, group }) => {
    if (link) return link;
    const links = grouped.get(group);
    return links.length === 1
      ? { ...links[0], label: group, icon: GROUP_ICONS[group] ?? links[0].icon }
      : {
          code: `${section}:${group}`,
          label: group,
          icon: GROUP_ICONS[group],
          links,
        };
  });
}

function dedupeBySlug(pages) {
  const seen = new Set();
  return pages.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

export function buildNavGroups({
  role,
  accessibleModules = {},
  programmeType = null,
} = {}) {
  const flags = { programmeType, role };
  const groups = [
    {
      section: "Overview",
      items: [
        {
          code: "home",
          label: "Home",
          icon: "House",
          to: "/dashboard",
        },
      ],
    },
  ];

  // Department staff keep a single screen; module access does not widen it.
  if (isDepartmentStaff(role)) {
    groups.push({
      section: "Scholarship",
      items: [
        {
          code: "assistantship",
          label: "Assistantship",
          icon: "Bank",
          to: "/scholarship/assistantship",
        },
      ],
    });
    return groups;
  }

  sectionsFor(role).forEach(({ id, section, base, pages }) => {
    if (!accessibleModules[id]) return;
    const visible = dedupeBySlug(pagesForRole(pages, role, flags));
    if (!visible.length) return;
    groups.push({ section, items: itemsFor(section, base, visible) });
  });

  const others = OTHER_MODULES.filter((m) => accessibleModules[m.id]).map(
    (m) => ({ code: m.id, label: m.label, icon: m.icon, to: m.to }),
  );
  if (others.length) groups.push({ section: "Modules", items: others });

  const fpsPages = dedupeBySlug(pagesForRole(FPS_PAGES, role, flags));
  if (fpsPages.length) {
    groups.push({
      section: "Professional Profile",
      items: itemsFor("Professional Profile", FPS_BASE, fpsPages),
    });
  }

  return groups;
}

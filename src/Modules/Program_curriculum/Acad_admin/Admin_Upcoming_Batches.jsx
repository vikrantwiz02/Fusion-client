/* eslint-disable */
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Modal,
  FileInput,
  Progress,
  Alert,
  Stepper,
  Textarea,
  Text,
  Stack,
  Card,
  ThemeIcon,
  Badge,
  Grid,
  Box,
  ActionIcon,
  Flex,
  Table,
  Switch,
  Tooltip,
  ScrollArea,
  Title,
} from "@mantine/core";
import {
  Plus,
  Download,
  Upload,
  FileXls,
  Users,
  User,
  GraduationCap,
  Check,
  CaretLeft,
  CaretRight,
  X,
  Info,
  MagnifyingGlass,
  Funnel,
  PencilSimple,
  Database,
  Warning,
} from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  fetchAdminBatchesOverview,
  processExcelUpload,
  saveStudentsBatch,
  addSingleStudent,
  exportStudentData,
  updateStudentStatus,
  createBatch,
  updateBatch,
  deleteBatch,
  setTotalSeats,
  updateStudent,
  deleteStudent,
} from "../api/api";

// Custom CSS to prevent text truncation in tables
const customTableStyles = `
  .student-allocation-table .mantine-Badge-root {
    overflow: visible !important;
    text-overflow: unset !important;
    white-space: nowrap !important;
    max-width: none !important;
    width: auto !important;
  }
  
  .student-allocation-table .mantine-Badge-inner {
    overflow: visible !important;
    text-overflow: unset !important;
    white-space: nowrap !important;
  }
  
  .student-allocation-table td {
    vertical-align: top !important;
    word-wrap: break-word !important;
  }
  
  .student-allocation-table th {
    text-align: center !important;
    font-weight: 600 !important;
    background-color: #f8f9fa !important;
  }
`;

/**
 * BACKEND API ENDPOINTS REQUIRED:
 *
 * 1. GET /programme_curriculum/api/batches/{programme_type}/
 *    - Returns list of batches for UG/PG/PHD with calculated seat information
 *    - Response: { success: true, data: [{ id, programme, discipline, year, totalSeats, filledSeats, availableSeats }] }
 *    - BACKEND LOGIC FOR SEAT CALCULATION:
 *      * totalSeats: Should be manually set by admin for each programme/discipline/year combination
 *      * filledSeats: Should be calculated by counting actual students enrolled in that specific branch/programme/year
 *        Example SQL: SELECT COUNT(*) FROM students WHERE branch = 'CSE' AND programme = 'B.Tech' AND year = 2024
 *      * availableSeats: Should be calculated as (totalSeats - filledSeats)
 *      * If filledSeats > totalSeats, availableSeats should be 0 (over-enrollment scenario)
 *
 * 2. GET /programme_curriculum/api/branches/
 *    - Returns available branches/disciplines
 *    - Response: { success: true, branches: [{ value, label, programme_type }] }
 *
 * 3. POST /programme_curriculum/api/process-excel/
 *    - Validates and processes uploaded Excel file
 *    - Body: FormData with file and programme type
 *    - Response: { success: true, valid_data: [], valid_records: number, invalid_records: number }
 *
 * 4. POST /programme_curriculum/api/upload-students/
 *    - Bulk upload students from Excel processing
 *    - Body: { students: [], programme: string }
 *    - Response: { success: true, data: { successful_uploads: number, failed_uploads: number } }
 *    - BACKEND LOGIC: After uploading students, should trigger recalculation of seat statistics
 *
 * 5. POST /programme_curriculum/api/add-student/
 *    - Add single student manually with full batch allocation algorithm
 *    - Body: { ...student_data, programme: string }
 *    - Response: { success: true, data: { student_id, roll_number, institute_email, password } }
 *    - BACKEND LOGIC:
 *      * Apply same batch allocation algorithm as Excel upload
 *      * Generate roll number based on current academic year and branch sequence
 *      * Create institute email (@iiitdmj.ac.in)
 *      * Generate secure password
 *      * Update batch statistics (filledSeats, availableSeats)
 *      * Add student to appropriate branch/programme/year group
 *    - UI IMPLEMENTATION: ✅ COMPLETE - Manual form with automatic processing
 *
 * 6. GET /programme_curriculum/api/export-students/{programme_type}/
 *    - Export student data as Excel
 *    - Response: Excel file download
 *
 * 7. PUT /programme_curriculum/api/set-total-seats/
 *    - Allows admin to manually set total seats for a programme/discipline/year
 *    - Body: { programme, discipline, year, totalSeats }
 *    - Response: { success: true, message: "Total seats updated successfully" }
 *    - BACKEND LOGIC: Should update totalSeats and recalculate availableSeats automatically
 *    - UI IMPLEMENTATION: ✅ COMPLETE - Inline editing with validation in batch table
 *
 * 8. BATCH ALLOCATION ALGORITHM - ✅ FRONTEND IMPLEMENTED
 *    - Automatically processes Excel data and allocates roll numbers
 *    - Groups students by branch code (BCS, BEC, BME, BSM, BDS, etc.)
 *    - Generates sequential roll numbers (e.g., 25BCS001, 25BEC002)
 *    - Creates institute emails (@iiitdmj.ac.in)
 *    - Generates random passwords for initial login
 *    - Provides allocation summary with branch-wise distribution
 *    - Ready for backend integration with student database
 */

// Constants
const PROGRAMME_TYPES = {
  UG: "ug",
  PG: "pg",
  PHD: "phd",
};

// const FORM_STEPS = [
//   { key: 'basic', label: 'Basic Info', description: 'Personal information', icon: User },
//   { key: 'additional', label: 'Additional Info', description: 'PWD, JEE & Address details', icon: GraduationCap },
//   { key: 'academic', label: 'Academic Info', description: 'Branch details', icon: GraduationCap },
//   { key: 'review', label: 'Review & Submit', description: 'Verify details', icon: Check }
// ];

// const BRANCHES = {
//   [PROGRAMME_TYPES.UG]: [
//     { value: 'CSE_BTECH', label: 'Computer Science and Engineering (B.Tech)' },
//     { value: 'ECE_BTECH', label: 'Electronics and Communication Engineering (B.Tech)' },
//     { value: 'ME_BTECH', label: 'Mechanical Engineering (B.Tech)' },
//     { value: 'SM_BTECH', label: 'Smart Manufacturing (B.Tech)' },
//     { value: 'DESIGN_BDES', label: 'Design (B.Des)' }
//   ],
//   [PROGRAMME_TYPES.PG]: [
//     { value: 'CSE_MTECH', label: 'Computer Science and Engineering (M.Tech)' },
//     { value: 'ECE_MTECH', label: 'Electronics and Communication Engineering (M.Tech)' },
//     { value: 'ME_MTECH', label: 'Mechanical Engineering (M.Tech)' },
//     { value: 'SM_MTECH', label: 'Smart Manufacturing (M.Tech)' },
//     { value: 'DESIGN_MDES', label: 'Design (M.Des)' }
//   ],
//   [PROGRAMME_TYPES.PHD]: [
//     { value: 'CSE_PHD', label: 'Computer Science and Engineering (PhD)' },
//     { value: 'ECE_PHD', label: 'Electronics and Communication Engineering (PhD)' },
//     { value: 'ME_PHD', label: 'Mechanical Engineering (PhD)' },
//     { value: 'SM_PHD', label: 'Smart Manufacturing (PhD)' },
//     { value: 'DESIGN_PHD', label: 'Design (PhD)' }
//   ]
// };

// Unified field structure for both Excel import and manual entry
const STUDENT_FIELDS_CONFIG = {
  // Core identification fields
  jeeAppNo: {
    label: "JEE App. No.",
    placeholder: "Enter JEE application number",
    required: true,
    excelColumns: [
      "jee main application number",
      "jee app. no.",
      "jee application number",
      "jeeprep",
      "jee app no",
      "rollno",
      "isprep",
    ],
  },
  name: {
    label: "Full Name",
    placeholder: "Enter full name",
    required: true,
    excelColumns: ["name", "student name", "full name"],
  },
  fname: {
    label: "Father Name",
    placeholder: "Enter father's name",
    required: true,
    excelColumns: [
      "father's name",
      "father name",
      "fname",
      "Father Name",
      "Father's Name",
      "father_name",
      "fatherName",
    ],
  },
  mname: {
    label: "Mother Name",
    placeholder: "Enter mother's name",
    required: true,
    excelColumns: [
      "mother's name",
      "mother name",
      "mname",
      "Mother Name",
      "Mother's Name",
      "mother_name",
      "motherName",
    ],
  },

  // Personal details
  gender: {
    label: "Gender",
    placeholder: "Select gender",
    required: true,
    type: "select",
    options: [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Other", label: "Other" },
    ],
    excelColumns: ["gender", "sex"],
  },
  category: {
    label: "Category",
    placeholder: "Select category",
    required: true,
    type: "select",
    options: [
      { value: "GEN", label: "General (GEN)" },
      { value: "OBC", label: "Other Backward Class (OBC)" },
      { value: "SC", label: "Scheduled Caste (SC)" },
      { value: "ST", label: "Scheduled Tribe (ST)" },
      { value: "EWS", label: "Economically Weaker Section (EWS)" },
    ],
    excelColumns: ["category", "caste", "reservation"],
  },
  allottedGender: {
    label: "Allotted Gender",
    placeholder: "Select allotted gender",
    required: false,
    type: "select",
    options: [
      { value: "Male", label: "Male" },
      { value: "Female", label: "Female" },
      { value: "Other", label: "Other" },
    ],
    excelColumns: ["allotted gender"],
  },
  allottedCategory: {
    label: "Allotted Category",
    placeholder: "Select allotted category",
    required: false,
    type: "select",
    options: [
      { value: "GEN", label: "General (GEN)" },
      { value: "OBC", label: "Other Backward Class (OBC)" },
      { value: "SC", label: "Scheduled Caste (SC)" },
      { value: "ST", label: "Scheduled Tribe (ST)" },
      { value: "EWS", label: "Economically Weaker Section (EWS)" },
    ],
    excelColumns: ["allottedcat", "allotted category"],
  },
  pwd: {
    label: "PWD (Person with Disability)",
    placeholder: "Select PWD status",
    required: true,
    type: "select",
    options: [
      { value: "YES", label: "Yes" },
      { value: "NO", label: "No" },
    ],
    excelColumns: ["pwd", "disability", "person with disability"],
  },

  // Academic information
  branch: {
    label: "Branch",
    placeholder: "Select branch",
    required: true,
    type: "select",
    excelColumns: [
      "discipline",
      "branch",
      "brtd",
      "brnm",
      "brcd",
      "department",
    ],
  },

  // Contact and address
  address: {
    label: "Address",
    placeholder: "Enter complete address",
    required: true,
    type: "textarea",
    excelColumns: [
      "full address",
      "address",
      "permanent address",
      "home address",
    ],
  },

  // Additional fields that should be in both Excel and manual entry
  phoneNumber: {
    label: "Phone Number",
    placeholder: "Enter phone number",
    required: false,
    excelColumns: [
      "mobileno",
      "phone",
      "mobile",
      "contact number",
      "phone number",
      "mobile no",
    ],
  },
  email: {
    label: "Personal Email",
    placeholder: "Enter personal email",
    required: false,
    type: "email",
    excelColumns: [
      "alternet email id",
      "email",
      "personal email",
      "email id",
      "alternate email",
      "Alternet Email ID",
      "personal_email",
      "personalEmail",
      "Email ID",
    ],
  },
  dob: {
    label: "Date of Birth",
    placeholder: "Select date of birth",
    required: false,
    type: "date",
    excelColumns: [
      "date of birth",
      "dob",
      "birth date",
      "Date of Birth",
      "DOB",
      "date_of_birth",
      "dateOfBirth",
    ],
  },
  jeeRank: {
    label: "AI Rank",
    placeholder: "Enter AI rank",
    required: false,
    type: "number",
    excelColumns: [
      "ai rank",
      "jee rank",
      "jee main rank",
      "rank",
      "AI Rank",
      "AI rank",
      "ai_rank",
      "aiRank",
      "JEE Rank",
    ],
  },
  categoryRank: {
    label: "Category Rank",
    placeholder: "Enter category rank",
    required: false,
    type: "number",
    excelColumns: ["category rank", "cat rank"],
  },

  // Additional fields from your Excel format
  fatherOccupation: {
    label: "Father's Occupation",
    placeholder: "Enter father's occupation",
    required: false,
    excelColumns: ["father's occupation", "father occupation"],
  },
  fatherMobile: {
    label: "Father's Mobile",
    placeholder: "Enter father's mobile number",
    required: false,
    excelColumns: ["father mobile number", "father mobile", "father phone"],
  },
  motherOccupation: {
    label: "Mother's Occupation",
    placeholder: "Enter mother's occupation",
    required: false,
    excelColumns: ["mother's occupation", "mother occupation"],
  },
  motherMobile: {
    label: "Mother's Mobile",
    placeholder: "Enter mother's mobile number",
    required: false,
    excelColumns: ["mother mobile number", "mother mobile", "mother phone"],
  },
  state: {
    label: "State",
    placeholder: "Enter state",
    required: false,
    excelColumns: ["state", "state name"],
  },
  rollNumber: {
    label: "Institute Roll Number",
    placeholder: "Enter institute roll number",
    required: false,
    excelColumns: [
      "institute roll number",
      "roll number",
      "rollno",
      "Institute Roll Number",
      "Roll Number",
      "roll_number",
      "rollNumber",
    ],
  },
  instituteEmail: {
    label: "Institute Email ID",
    placeholder: "Enter institute email",
    required: false,
    type: "email",
    excelColumns: [
      "institute email id",
      "institute email",
      "official email",
      "Institute Email ID",
      "Institute Email",
      "institute_email",
      "instituteEmail",
    ],
  },
};

const INITIAL_FORM_DATA = {
  // Core fields (required)
  jeeAppNo: "",
  name: "",
  fname: "",
  mname: "",
  gender: "",
  category: "",
  pwd: "NO",
  branch: "",
  address: "",

  // Additional fields (optional)
  phoneNumber: "",
  email: "",
  dob: "",
  jeeRank: "",
  categoryRank: "",

  // Excel fields
  allottedGender: "",
  allottedCategory: "",
  fatherOccupation: "",
  fatherMobile: "",
  motherOccupation: "",
  motherMobile: "",
  state: "",
  rollNumber: "",
  instituteEmail: "",
};

// Main Component
const AdminUpcomingBatch = () => {
  // Redux state management
  const dispatch = useDispatch();
  const { userDetails } = useSelector((state) => state.user);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State management
  const [activeSection, setActiveSection] = useState(PROGRAMME_TYPES.UG);
  const [ugBatches, setUgBatches] = useState([]);
  const [pgBatches, setPgBatches] = useState([]);
  const [phdBatches, setPhdBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function to get dynamic field mapping based on unified configuration
  const getFieldMapping = () => {
    const mapping = {};
    Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
      mapping[fieldKey] = STUDENT_FIELDS_CONFIG[fieldKey].excelColumns;
    });
    return mapping;
  };

  // Helper function to get field display names
  const getFieldDisplayName = (fieldName) => {
    return STUDENT_FIELDS_CONFIG[fieldName]?.label || fieldName;
  };

  // Helper function to get available fields from unified configuration
  const getAvailableFields = () => {
    return Object.keys(STUDENT_FIELDS_CONFIG);
  };

  // Helper function to parse backend duplicate errors and return user-friendly messages
  const parseDuplicateError = (error, context = "operation") => {
    let errorMessage = `Failed to ${context}`;
    let errorTitle = "Error";

    if (error.response?.data?.message) {
      const backendMessage = error.response.data.message.toLowerCase();

      // Check for duplicate JEE Application Number
      if (
        backendMessage.includes("jee_app_no") &&
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate JEE Application Number";
        errorMessage = context.includes("upload")
          ? "One or more JEE Application Numbers already exist in the database. Please check your Excel file and remove duplicates."
          : "This JEE Application Number already exists in the database. Please check and enter a different number.";
      }
      // Check for duplicate Roll Number
      else if (
        backendMessage.includes("roll_number") &&
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate Roll Number";
        errorMessage = context.includes("upload")
          ? "One or more Institute Roll Numbers already exist in the database. Please check your Excel file and remove duplicates."
          : "This Institute Roll Number already exists in the database. Please check and enter a different number.";
      }
      // Check for duplicate Institute Email
      else if (
        backendMessage.includes("institute_email") &&
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate Institute Email";
        errorMessage = context.includes("upload")
          ? "One or more Institute Email IDs already exist in the database. Please check your Excel file and remove duplicates."
          : "This Institute Email ID already exists in the database. Please check and enter a different email.";
      }
      // Generic duplicate key error
      else if (
        backendMessage.includes("duplicate key") ||
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate Entries";
        errorMessage = context.includes("upload")
          ? "Some entries in your Excel file already exist in the database. Please check for duplicate JEE App Numbers, Roll Numbers, and Institute Emails."
          : "Some information you entered already exists in the database. Please check JEE App No, Roll Number, and Institute Email for duplicates.";
      }
      // Other backend errors
      else {
        errorMessage = error.response.data.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { title: errorTitle, message: errorMessage };
  };

  // Helper function to validate required fields
  const validateRequiredFields = (formData, isEditMode = false) => {
    const errors = {};

    // Define dropdown fields that should not be validated in edit mode
    const dropdownFields = [
      "gender",
      "category",
      "allottedGender",
      "allottedCategory",
      "pwd",
      "branch",
    ];

    Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
      const fieldConfig = STUDENT_FIELDS_CONFIG[fieldKey];

      // Skip dropdown fields validation in edit mode
      if (isEditMode && dropdownFields.includes(fieldKey)) {
        return;
      }

      if (
        fieldConfig.required &&
        (!formData[fieldKey] || formData[fieldKey].trim() === "")
      ) {
        errors[fieldKey] = `${fieldConfig.label} is required`;
      }
    });

    return errors;
  };

  // Helper function to validate required fields for current step only
  const validateCurrentStep = (formData, step, isEditMode = false) => {
    const errors = {};
    let fieldsToValidate = [];

    // Define dropdown fields that should not be validated in edit mode
    const dropdownFields = [
      "gender",
      "category",
      "allottedGender",
      "allottedCategory",
      "pwd",
      "branch",
    ];

    // Define which fields are required for each step
    switch (step) {
      case 0: // Basic Info
        fieldsToValidate = ["name", "fname", "mname", "gender", "category"];
        break;
      case 1: // Additional Info
        fieldsToValidate = ["pwd", "jeeAppNo", "address"];
        break;
      case 2: // Academic Info
        fieldsToValidate = ["branch"];
        break;
      default:
        return errors;
    }

    // Filter out dropdown fields in edit mode
    if (isEditMode) {
      fieldsToValidate = fieldsToValidate.filter(
        (field) => !dropdownFields.includes(field),
      );
    }

    // Only validate the fields for the current step
    fieldsToValidate.forEach((fieldKey) => {
      const fieldConfig = STUDENT_FIELDS_CONFIG[fieldKey];
      if (
        fieldConfig &&
        fieldConfig.required &&
        (!formData[fieldKey] || formData[fieldKey].trim() === "")
      ) {
        errors[fieldKey] = `${fieldConfig.label} is required`;
      }
    });

    return errors;
  };

  // BATCH ALLOCATION ALGORITHM FUNCTIONS
  // These implement the logic from your handwritten notes

  // Function to get current academic year based on date
  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth(); // 0-based, so June is 5

    // Academic year runs from July to June
    // If current month is July (6) to December (11), academic year is current-next
    // If current month is January (0) to June (5), academic year is previous-current
    if (month >= 6) {
      // July to December
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
      // January to June
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    }
  };

  // Function to get current year for backend compatibility
  // Returns the starting year of the academic year (matches backend logic)
  const getCurrentBatchYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth(); // 0-based, so June is 5

    // For August 2025: returns 2025 (for 2025-26 academic year)
    // This matches the backend's academic year calculation
    if (month >= 6) {
      // July to December
      return currentYear;
    } else {
      // January to June
      return currentYear - 1;
    }
  };

  // Pre-process Excel file to determine correct programmes before backend processing
  const preProcessExcelFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            resolve({ disciplineMapping: {} });
            return;
          }

          const headers = jsonData[0].map((h) =>
            h.toString().toLowerCase().trim(),
          );
          const disciplineColumnIndex = headers.findIndex(
            (h) =>
              h.includes("discipline") ||
              h.includes("branch") ||
              h.includes("department"),
          );

          if (disciplineColumnIndex === -1) {
            resolve({ disciplineMapping: {} });
            return;
          }

          // Analyze disciplines and determine programmes
          const disciplineMapping = {};
          const disciplineCounts = {
            btech: 0,
            bdes: 0,
            mtech: 0,
            mdes: 0,
            phd: 0,
          };

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row[disciplineColumnIndex]) {
              const discipline = row[disciplineColumnIndex]
                .toString()
                .toLowerCase()
                .trim();
              let detectedProgramme = "";

              // Determine programme based on discipline
              if (discipline.includes("design")) {
                detectedProgramme =
                  activeSection === "ug"
                    ? "B.Des"
                    : activeSection === "pg"
                      ? "M.Des"
                      : "PhD";
                disciplineCounts[
                  activeSection === "ug"
                    ? "bdes"
                    : activeSection === "pg"
                      ? "mdes"
                      : "phd"
                ] += 1;
              } else if (
                discipline.includes("cse") ||
                discipline.includes("computer") ||
                discipline.includes("ece") ||
                discipline.includes("electronics") ||
                discipline.includes("me") ||
                discipline.includes("mechanical") ||
                discipline.includes("sm") ||
                discipline.includes("smart") ||
                discipline.includes("manufacturing")
              ) {
                detectedProgramme =
                  activeSection === "ug"
                    ? "B.Tech"
                    : activeSection === "pg"
                      ? "M.Tech"
                      : "PhD";
                disciplineCounts[
                  activeSection === "ug"
                    ? "btech"
                    : activeSection === "pg"
                      ? "mtech"
                      : "phd"
                ] += 1;
              }

              disciplineMapping[discipline] = detectedProgramme;
            }
          }

          // Check for potential mismatches and warn user
          const totalStudents = Object.values(disciplineCounts).reduce(
            (sum, count) => sum + count,
            0,
          );
          let warningMessage = "";

          if (activeSection === "ug") {
            const designStudents = disciplineCounts.bdes;
            const techStudents = disciplineCounts.btech;

            if (designStudents > 0 && techStudents > 0) {
              warningMessage = `⚠️ Mixed programmes detected: ${techStudents} B.Tech students and ${designStudents} B.Des students. Consider uploading them separately for better organization.`;
            } else if (designStudents > 0 && techStudents === 0) {
              warningMessage = `ℹ️ All ${designStudents} students appear to be B.Des (Design) students.`;
            } else if (techStudents > 0 && designStudents === 0) {
              warningMessage = `ℹ️ All ${techStudents} students appear to be B.Tech students.`;
            }
          }

          resolve({ disciplineMapping, disciplineCounts, warningMessage });
        } catch (error) {
          resolve({ disciplineMapping: {} });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Function to determine the correct programme based on discipline and programme type
  const determineCorrectProgramme = (discipline, programmeType) => {
    const disciplineLower = (discipline || "").toLowerCase().trim();

    // For UG students
    if (programmeType === "ug") {
      if (
        disciplineLower.includes("design") ||
        disciplineLower.includes("bdes")
      ) {
        return "B.Des";
      } else {
        // CSE, ECE, ME, SM all go to B.Tech
        return "B.Tech";
      }
    }

    // For PG students
    if (programmeType === "pg") {
      if (
        disciplineLower.includes("design") ||
        disciplineLower.includes("mdes")
      ) {
        return "M.Des";
      } else {
        // CSE, ECE, ME, SM all go to M.Tech
        return "M.Tech";
      }
    }

    // For PhD students
    if (programmeType === "phd") {
      return "PhD";
    }

    // Default fallback
    return programmeType === "ug"
      ? "B.Tech"
      : programmeType === "pg"
        ? "M.Tech"
        : "PhD";
  };

  // Function to determine branch code from branch name or existing code
  const getBranchCode = (branchName, branchCode, getDisplayCode = false) => {
    // Normalize the input
    const branch = (branchName || branchCode || "").toLowerCase().trim();

    // Branch code mapping - Display names vs Roll number codes
    const branchMappings = {
      // B.Tech programmes - Display: CSE, ECE, ME, SM | Roll Number: BCS, BEC, BME, BSM
      "computer science and engineering": { display: "CSE", rollCode: "BCS" },
      cse: { display: "CSE", rollCode: "BCS" },
      "computer science": { display: "CSE", rollCode: "BCS" },
      "electronics and communication engineering": {
        display: "ECE",
        rollCode: "BEC",
      },
      ece: { display: "ECE", rollCode: "BEC" },
      electronics: { display: "ECE", rollCode: "BEC" },
      "mechanical engineering": { display: "ME", rollCode: "BME" },
      mechanical: { display: "ME", rollCode: "BME" },
      me: { display: "ME", rollCode: "BME" },
      "smart manufacturing": { display: "SM", rollCode: "BSM" },
      sm: { display: "SM", rollCode: "BSM" },
      manufacturing: { display: "SM", rollCode: "BSM" },

      // B.Des programmes - Display: DES | Roll Number: BDS
      design: { display: "DES", rollCode: "BDS" },
      bdes: { display: "DES", rollCode: "BDS" },

      // M.Tech programmes
      "mtech computer science": { display: "CSE", rollCode: "MCS" },
      "mtech electronics": { display: "ECE", rollCode: "MEC" },
      "mtech mechanical": { display: "ME", rollCode: "MME" },
      "mtech smart manufacturing": { display: "SM", rollCode: "MSM" },

      // M.Des programmes
      "mdes design": { display: "DES", rollCode: "MDS" },

      // PhD programmes
      "phd computer science": { display: "CSE", rollCode: "PCS" },
      "phd electronics": { display: "ECE", rollCode: "PEC" },
      "phd mechanical": { display: "ME", rollCode: "PME" },
      "phd smart manufacturing": { display: "SM", rollCode: "PSM" },
      "phd design": { display: "DES", rollCode: "PDS" },
    };

    // Try to find a match
    const matchedEntry = Object.entries(branchMappings).find(([key]) =>
      branch.includes(key),
    );
    if (matchedEntry) {
      const [, codes] = matchedEntry;
      return getDisplayCode ? codes.display : codes.rollCode;
    }

    // Return default or existing code
    const result = branchCode || "UNK";
    return result;
  };

  // Function to get display branch name for UI
  const getDisplayBranchName = (branchName, branchCode) => {
    const branch = (branchName || branchCode || "").toLowerCase().trim();

    const branchMappings = {
      "computer science and engineering": "CSE",
      cse: "CSE",
      "computer science": "CSE",
      "electronics and communication engineering": "ECE",
      ece: "ECE",
      electronics: "ECE",
      "mechanical engineering": "ME",
      mechanical: "ME",
      me: "ME",
      "smart manufacturing": "SM",
      sm: "SM",
      manufacturing: "SM",
      design: "DES",
      bdes: "DES",
    };

    const matchedBranch = Object.entries(branchMappings).find(([key]) =>
      branch.includes(key),
    );
    if (matchedBranch) {
      const [, displayName] = matchedBranch;
      return displayName;
    }

    return branchName || branchCode || "Unknown";
  };

  // Function to generate roll number based on branch and sequence
  const generateRollNumber = (branchCode, year, sequence) => {
    // Extract last 2 digits of year (e.g., 2025 -> 25)
    const yearSuffix = year.toString().slice(-2);

    // Pad sequence number to 3 digits
    const sequenceNumber = sequence.toString().padStart(3, "0");

    // Generate roll number format: YYBCCseq (e.g., 25BCS001, 25BEC002)
    return `${yearSuffix}${branchCode}${sequenceNumber}`;
  };

  // Function to generate institute email
  const generateInstituteEmail = (rollNumber) => {
    return `${rollNumber.toLowerCase()}@iiitdmj.ac.in`;
  };

  // Main batch allocation algorithm
  const processBatchAllocation = (studentData, programmeType) => {
    const batchYear = parseInt(getCurrentBatchYear(), 10); // Use starting year for roll numbers (e.g., 2025 for 2025-26)

    // Step 1: Group students by branch
    const branchGroups = {};

    studentData.forEach((student, index) => {
      const branchCode = getBranchCode(student.branch, student.branchCode);

      if (!branchGroups[branchCode]) {
        branchGroups[branchCode] = [];
      }

      branchGroups[branchCode].push({
        ...student,
        branchCode,
        displayBranch: getDisplayBranchName(student.branch, student.branchCode),
        originalIndex: index,
      });
    });

    // Step 2: Sort students within each branch (by name for consistency)
    Object.keys(branchGroups).forEach((branchCode) => {
      branchGroups[branchCode].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Step 3: Allocate roll numbers sequentially within each branch
    const processedStudents = [];
    const branchCounters = {};

    Object.keys(branchGroups).forEach((branchCode) => {
      branchCounters[branchCode] = 1; // Start from 001

      branchGroups[branchCode].forEach((student) => {
        const rollNumber = generateRollNumber(
          branchCode,
          batchYear,
          branchCounters[branchCode],
        );
        const instituteEmail = generateInstituteEmail(rollNumber);

        processedStudents.push({
          ...student,
          rollNumber,
          instituteEmail,
          year: batchYear,
          programme: programmeType.toUpperCase(),
          allocationDate: new Date().toISOString(),
          status: "ALLOCATED",
          reportedStatus: "NOT_REPORTED", // Default status
        });

        branchCounters[branchCode] += 1;
      });
    });

    // Step 4: Sort final list by roll number for display
    processedStudents.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    return {
      students: processedStudents,
      summary: {
        totalStudents: processedStudents.length,
        branchCounts: Object.keys(branchCounters).reduce((acc, branch) => {
          acc[branch] = branchCounters[branch] - 1;
          return acc;
        }, {}),
        year: getCurrentBatchYear(), // Use backend-compatible year format
        academicYear: getCurrentAcademicYear(),
        programme: programmeType.toUpperCase(),
        allocationDate: new Date().toISOString(),
      },
    };
  };

  // Helper function to add manually processed student to existing batch data
  const addStudentToExistingBatch = (processedStudent) => {
    const { programme, displayBranch, branchCode } = processedStudent;

    // Determine which batch array to update based on programme type
    let currentBatches;
    let setBatchFunction;

    switch (programme.toLowerCase()) {
      case "ug":
      case "b.tech":
        currentBatches = [...ugBatches];
        setBatchFunction = setUgBatches;
        break;
      case "pg":
      case "m.tech":
        currentBatches = [...pgBatches];
        setBatchFunction = setPgBatches;
        break;
      case "phd":
        currentBatches = [...phdBatches];
        setBatchFunction = setPhdBatches;
        break;
      default:
        currentBatches = [...ugBatches];
        setBatchFunction = setUgBatches;
    }

    // Find existing batch for the same branch/discipline
    const existingBatchIndex = currentBatches.findIndex(
      (batch) =>
        batch.displayBranch === displayBranch ||
        batch.discipline.includes(displayBranch),
    );

    if (existingBatchIndex !== -1) {
      // Add student to existing batch
      currentBatches[existingBatchIndex].students.push(processedStudent);
      currentBatches[existingBatchIndex].filledSeats += 1;
      currentBatches[existingBatchIndex].availableSeats = Math.max(
        0,
        currentBatches[existingBatchIndex].totalSeats -
          currentBatches[existingBatchIndex].filledSeats,
      );
    } else {
      // Create new batch for this branch
      const newBatch = {
        id: Date.now(), // Simple ID generation
        programme: determineCorrectProgramme(displayBranch, programme),
        discipline:
          displayBranch === "CSE"
            ? "Computer Science and Engineering"
            : displayBranch === "ECE"
              ? "Electronics and Communication Engineering"
              : displayBranch === "ME"
                ? "Mechanical Engineering"
                : displayBranch === "SM"
                  ? "Smart Manufacturing"
                  : displayBranch === "DES"
                    ? "Design"
                    : displayBranch,
        displayBranch,
        year: parseInt(getCurrentBatchYear(), 10),
        totalSeats: 60, // Default value, can be updated later
        filledSeats: 1,
        availableSeats: 59,
        students: [processedStudent],
      };
      currentBatches.push(newBatch);
    }

    // Update the state with modified batch data
    setBatchFunction(currentBatches);
  };

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState(
    getCurrentBatchYear().toString(),
  ); // Always set to current academic year
  const [filterProgramme, setFilterProgramme] = useState("");

  // Modal and form states
  const [modalOpened, setModalOpened] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [entryMode, setEntryMode] = useState("excel"); // 'excel' or 'manual'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState([]);

  // Batch allocation states
  const [processedBatchData, setProcessedBatchData] = useState(null);
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [showBatchPreview, setShowBatchPreview] = useState(false);

  // Manual entry form states
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [manualFormData, setManualFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  // Edit total seats states
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editTotalSeats, setEditTotalSeats] = useState("");
  const [seatsUpdateLoading, setSeatsUpdateLoading] = useState(false);

  // CRUD operations states
  const [editingRow, setEditingRow] = useState(null); // ID of row being edited
  const [editFormData, setEditFormData] = useState({}); // Form data for editing
  const [showAddBatchModal, setShowAddBatchModal] = useState(false); // Add new batch modal
  const [newBatchData, setNewBatchData] = useState({
    programme: "",
    discipline: "",
    year: getCurrentBatchYear(),
    totalSeats: 60,
  });
  const [deletingBatchId, setDeletingBatchId] = useState(null); // ID of batch being deleted
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation modal

  // Student deletion confirmation modal
  const [showDeleteStudentConfirm, setShowDeleteStudentConfirm] =
    useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Student list modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [updatingReportStatus, setUpdatingReportStatus] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Student modal search and export states
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});
  const [exportFormat, setExportFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [selectAllFields, setSelectAllFields] = useState(true);

  // API Functions - Connected to real backend
  const fetchBatchData = async () => {
    setLoading(true);
    try {
      const response = await fetchAdminBatchesOverview();

      if (response.success) {
        // Frontend categorization fix - properly group batches by programme type
        const allBatches = [
          ...(response.data.ug || []),
          ...(response.data.pg || []),
          ...(response.data.phd || []),
        ];

        // Use helper function to categorize batches
        const categorizedBatches = categorizeBatchesByProgramme(allBatches);

        // Set the properly categorized batch data
        setUgBatches(categorizedBatches.ug);
        setPgBatches(categorizedBatches.pg);
        setPhdBatches(categorizedBatches.phd);
      } else {
        throw new Error(response.message || "Failed to fetch batch data");
      }
    } catch (error) {
      // Only show error notifications - these are important for user
      notifications.show({
        title: "Error",
        message: "Failed to load batch data. Please try again.",
        color: "red",
      });

      // Initialize with empty arrays instead of mock data
      setUgBatches([]);
      setPgBatches([]);
      setPhdBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to categorize batches by programme type
  const categorizeBatchesByProgramme = (allBatches) => {
    const categorized = {
      ug: [],
      pg: [],
      phd: [],
    };

    allBatches.forEach((batch) => {
      // Check multiple possible fields for programme type
      const programme = (batch.programme || "").trim();
      const name = (batch.name || "").trim();
      const discipline = (batch.discipline || "").toLowerCase();
      const displayBranch = (batch.displayBranch || "").toLowerCase();

      // Try multiple detection methods - Updated to handle combined programme-discipline strings
      if (
        programme.startsWith("B.Tech") ||
        programme.startsWith("B.Design") ||
        name.startsWith("B.Tech") ||
        name.startsWith("B.Design") ||
        programme === "B.Tech" ||
        programme === "B.Des"
      ) {
        categorized.ug.push(batch);
      } else if (
        programme.startsWith("M.Tech") ||
        programme.startsWith("M.Des") ||
        name.startsWith("M.Tech") ||
        name.startsWith("M.Des") ||
        programme === "M.Tech" ||
        programme === "M.Des"
      ) {
        categorized.pg.push(batch);
      } else if (
        programme.startsWith("PhD") ||
        programme.startsWith("Phd") ||
        programme.toLowerCase().includes("phd") ||
        name.startsWith("PhD") ||
        name.startsWith("Phd") ||
        programme === "PhD"
      ) {
        categorized.phd.push(batch);
      } else {
        // Enhanced fallback logic
        if (
          discipline.includes("phd") ||
          displayBranch.includes("phd") ||
          discipline.includes("doctor") ||
          name.toLowerCase().includes("phd")
        ) {
          categorized.phd.push(batch);
        } else if (
          discipline.includes("m.tech") ||
          discipline.includes("mtech") ||
          discipline.includes("m.des") ||
          discipline.includes("mdes") ||
          displayBranch.includes("mtech") ||
          displayBranch.includes("mdes") ||
          discipline.includes("master") ||
          name.toLowerCase().includes("m.")
        ) {
          categorized.pg.push(batch);
        } else {
          // Default to UG if unclear
          categorized.ug.push(batch);
        }
      }
    });

    return categorized;
  };

  // Load data on component mount
  useEffect(() => {
    fetchBatchData();
  }, []);

  // Reset programme filter when switching between UG/PG/PHD tabs
  useEffect(() => {
    setFilterProgramme(""); // Reset to "All Programmes" when tab changes
  }, [activeSection]);

  // Debug: Monitor manualFormData changes
  useEffect(() => {
    // Debug logging for fname and mname tracking
  }, [manualFormData]);

  // Handle editing student data mapping
  useEffect(() => {
    if (editingStudent && showAddModal && addMode === "manual") {
      // Define dropdown fields that should not be editable (keep original DB values)
      const dropdownFields = [
        "gender",
        "category",
        "allottedGender",
        "allottedCategory",
        "pwd",
        "branch",
      ];

      // Map student data to form fields
      const studentData = {};
      Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
        const fieldConfig = STUDENT_FIELDS_CONFIG[fieldKey];
        let value = "";

        // Skip dropdown fields - they should remain as original DB values, not editable
        if (dropdownFields.includes(fieldKey)) {
          return;
        }

        // Direct field match
        if (
          editingStudent[fieldKey] !== undefined &&
          editingStudent[fieldKey] !== null &&
          editingStudent[fieldKey] !== ""
        ) {
          value = editingStudent[fieldKey];
        }
        // Excel column mapping
        else if (fieldConfig.excelColumns) {
          for (const excelCol of fieldConfig.excelColumns) {
            const colValue = editingStudent[excelCol];
            if (
              colValue !== undefined &&
              colValue !== null &&
              colValue !== ""
            ) {
              value = colValue;
              break;
            }
          }
        }

        // Special handling for all known field variations
        if (!value) {
          const specialMappings = {
            fname: [
              "father_name",
              "fatherName",
              "father",
              "Father Name",
              "Father's Name",
            ],
            mname: [
              "mother_name",
              "motherName",
              "mother",
              "Mother Name",
              "Mother's Name",
            ],
            name: ["Name", "student_name", "full_name", "fullName"],
            email: [
              "personal_email",
              "personalEmail",
              "alternet_email_id",
              "Alternet Email ID",
            ],
            phoneNumber: [
              "phone_number",
              "phoneNumber",
              "mobile",
              "Mobile",
              "contact",
            ],
            dob: ["date_of_birth", "dateOfBirth", "Date of Birth", "DOB"],
            jeeRank: ["ai_rank", "aiRank", "AI rank", "AI Rank"],
            jeeAppNo: [
              "jee_app_no",
              "jeeAppNo",
              "application_no",
              "Application No",
            ],
            address: ["Address", "permanent_address", "permanentAddress"],
            state: ["State", "home_state", "homeState"],
          };

          const variations = specialMappings[fieldKey] || [];

          for (const variation of variations) {
            if (
              editingStudent[variation] !== undefined &&
              editingStudent[variation] !== null &&
              editingStudent[variation] !== ""
            ) {
              value = editingStudent[variation];
              break;
            }
          }
        }

        studentData[fieldKey] = value || "";
      });

      setManualFormData(studentData);
    }
  }, [editingStudent, showAddModal, addMode]);

  // Initialize export fields when export modal opens
  useEffect(() => {
    if (showExportModal && Object.keys(selectedFields).length === 0) {
      initializeSelectedFields();
    }
  }, [showExportModal]);

  // Get current batch data based on active section
  const getCurrentBatches = () => {
    if (activeSection === "ug") return ugBatches;
    if (activeSection === "pg") return pgBatches;
    return phdBatches;
  }; // Filter batches based on search and filters
  const filteredBatches = getCurrentBatches().filter((batch) => {
    const matchesSearch =
      searchQuery === "" ||
      batch.programme.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (batch.displayBranch &&
        batch.displayBranch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesYear =
      filterYear === "" || batch.year.toString() === filterYear;
    const matchesProgramme =
      filterProgramme === "" || batch.programme === filterProgramme;

    return matchesSearch && matchesYear && matchesProgramme;
  });

  // Handle file upload for Excel - Now connected to backend with enhanced programme detection
  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    if (file) {
      setIsProcessing(true);
      setUploadProgress(10);

      try {
        setUploadProgress(30);

        // Pre-process Excel to determine programmes for each student
        const preProcessedData = await preProcessExcelFile(file);

        // Call backend API to process Excel file
        const response = await processExcelUpload(file, activeSection);

        setUploadProgress(80);

        if (response.success) {
          setExtractedData(response.valid_students);
          setUploadProgress(100);

          notifications.show({
            title: "Success",
            message: `Excel file processed successfully! ${response.valid_records} valid records found.`,
            color: "green",
          });

          // Simple extraction - take all data as-is from Excel
          const validStudents = response.valid_students || [];
          const invalidStudents = response.invalid_students || [];

          // Extract data from invalid students (they have the actual data in .data field)
          const invalidStudentData = invalidStudents.map((item) => ({
            ...item.data,
            _validation_error: item.error, // Keep track of validation error for display only
            _row_number: item.row,
          }));

          // Combine all students for preview - no sorting, no email generation
          const allStudents = [...validStudents, ...invalidStudentData];

          // Group by discipline for display purposes
          const disciplineGroups = allStudents.reduce((groups, student) => {
            const discipline =
              student.branch || student.discipline || "Unknown";
            if (!groups[discipline]) {
              groups[discipline] = [];
            }
            groups[discipline].push(student);
            return groups;
          }, {});

          // Debug: Check field names in processed data
          if (allStudents.length > 0) {
          }

          setExtractedData(allStudents);
          setShowPreview(true);
        } else {
          throw new Error(response.message || "Failed to process Excel file");
        }
      } catch (error) {
        setUploadProgress(0);

        notifications.show({
          title: "Error",
          message:
            error.message ||
            "Failed to process Excel file. Please check the format and try again.",
          color: "red",
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Function to apply case conversion rules
  const applyCaseConversion = (student) => {
    const convertedStudent = { ...student };

    // Email fields that should remain lowercase
    const emailFields = [
      "email",
      "instituteEmail",
      "personalEmail",
      "personal_email",
      "institute_email",
    ];

    // Fields that should be converted to uppercase (all text fields except emails)
    const fieldsToConvert = [
      "name",
      "fname",
      "mname",
      "father_name",
      "mother_name",
      "address",
      "state",
      "fatherOccupation",
      "father_occupation",
      "motherOccupation",
      "mother_occupation",
      "rollNumber",
      "roll_number",
    ];

    Object.keys(convertedStudent).forEach((key) => {
      const value = convertedStudent[key];

      if (typeof value === "string" && value.trim() !== "") {
        if (emailFields.includes(key)) {
          // Convert email fields to lowercase
          convertedStudent[key] = value.toLowerCase().trim();
          if (key === "instituteEmail" || key === "email") {
          }
        } else if (fieldsToConvert.includes(key)) {
          // Convert specified fields to uppercase
          convertedStudent[key] = value.toUpperCase().trim();
          if (key === "name" || key === "rollNumber") {
          }
        } else {
          // For other fields, just trim whitespace
          convertedStudent[key] = value.trim();
        }
      }
    });

    return convertedStudent;
  };

  // Export utility functions
  const getExportableFields = () => {
    return Object.keys(STUDENT_FIELDS_CONFIG)
      .filter((key) => !STUDENT_FIELDS_CONFIG[key].systemGenerated) // Exclude system-generated fields like password
      .map((key) => ({
        key,
        label: STUDENT_FIELDS_CONFIG[key].label,
        type: STUDENT_FIELDS_CONFIG[key].type,
      }));
  };

  const initializeSelectedFields = () => {
    const fields = {};
    getExportableFields().forEach((field) => {
      // Exclude system-generated fields like password from default selection
      fields[field.key] = !STUDENT_FIELDS_CONFIG[field.key].systemGenerated;
    });
    setSelectedFields(fields);
  };

  const handleSelectAllFields = (checked) => {
    const newSelectedFields = {};
    getExportableFields().forEach((field) => {
      newSelectedFields[field.key] = checked;
    });
    setSelectedFields(newSelectedFields);
    setSelectAllFields(checked);
  };

  const handleToggleAllFields = (event) => {
    const checked = event.currentTarget.checked;
    handleSelectAllFields(checked);
  };

  const handleFieldChange = (fieldKey, checked) => {
    const newSelectedFields = {
      ...selectedFields,
      [fieldKey]: checked,
    };
    setSelectedFields(newSelectedFields);

    // Update the "Select All" toggle based on whether all fields are selected
    const allFields = getExportableFields();
    const allSelected = allFields.every(
      (field) => newSelectedFields[field.key],
    );
    const noneSelected = allFields.every(
      (field) => !newSelectedFields[field.key],
    );

    if (allSelected) {
      setSelectAllFields(true);
    } else if (noneSelected) {
      setSelectAllFields(false);
    } else {
      // Mixed state - you could use an indeterminate state here if needed
      setSelectAllFields(false);
    }
  };

  const prepareExportData = (students, selectedFieldKeys) => {
    // Define the priority order for fields with logical grouping:
    // 1. Basic identification: Roll Number, JEE App No, Full Name, Institute Email
    // 2. Personal info: Gender, Category, PWD, DOB, Phone, Personal Email, Address, State
    // 3. Academic info: Branch, JEE Rank, Category Rank
    // 4. Parents info: Father Name, Father Occupation, Father Mobile, Mother Name, Mother Occupation, Mother Mobile
    const priorityFields = [
      "rollNumber",
      "jeeAppNo",
      "name",
      "instituteEmail", // Basic identification
      "gender",
      "category",
      "allottedGender",
      "allottedCategory",
      "pwd",
      "dob",
      "phoneNumber",
      "email",
      "address",
      "state", // Personal info
      "branch",
      "jeeRank",
      "categoryRank", // Academic info
      "fname",
      "fatherOccupation",
      "fatherMobile",
      "mname",
      "motherOccupation",
      "motherMobile", // Parents info
    ];

    // Sort selected fields to maintain priority order
    const sortedFieldKeys = [
      ...priorityFields.filter((field) => selectedFieldKeys.includes(field)),
      ...selectedFieldKeys.filter((field) => !priorityFields.includes(field)),
    ];

    return students.map((student, index) => {
      const exportRow = {};

      // Always add S.No as the first column
      exportRow["S.No"] = index + 1;

      sortedFieldKeys.forEach((fieldKey) => {
        const fieldConfig = STUDENT_FIELDS_CONFIG[fieldKey];
        let value = "";

        // Enhanced field mapping with specific handling for problematic fields
        if (fieldKey === "fname") {
          // Father name variations
          value =
            student.fname ||
            student.father_name ||
            student["Father Name"] ||
            student["Father's Name"] ||
            student.fatherName ||
            student["father name"] ||
            student["father's name"] ||
            "";
        } else if (fieldKey === "mname") {
          // Mother name variations
          value =
            student.mname ||
            student.mother_name ||
            student["Mother Name"] ||
            student["Mother's Name"] ||
            student.motherName ||
            student["mother name"] ||
            student["mother's name"] ||
            "";
        } else if (fieldKey === "email") {
          // Personal email variations
          value =
            student.email ||
            student.personal_email ||
            student.personalEmail ||
            student["personal email"] ||
            student["Alternet Email ID"] ||
            student["alternet email id"] ||
            student["alternate email"] ||
            student["email id"] ||
            "";
        } else if (fieldKey === "dob") {
          // Date of birth variations
          value =
            student.dob ||
            student.date_of_birth ||
            student.dateOfBirth ||
            student["Date of Birth"] ||
            student["date of birth"] ||
            student["birth date"] ||
            "";
        } else if (fieldKey === "jeeRank") {
          // AI Rank variations
          value =
            student.jeeRank ||
            student.ai_rank ||
            student.aiRank ||
            student["AI Rank"] ||
            student["ai rank"] ||
            student["AI rank"] ||
            student["jee rank"] ||
            student["jee main rank"] ||
            student.rank ||
            "";
        } else if (fieldKey === "rollNumber") {
          // Roll number variations
          value =
            student.rollNumber ||
            student.roll_number ||
            student.rollno ||
            student["Institute Roll Number"] ||
            student["institute roll number"] ||
            student["Roll Number"] ||
            student["roll number"] ||
            "";
        } else if (fieldKey === "instituteEmail") {
          // Institute email variations
          value =
            student.instituteEmail ||
            student.institute_email ||
            student["Institute Email ID"] ||
            student["institute email id"] ||
            student["institute email"] ||
            student["official email"] ||
            "";
        } else {
          // Generic field mapping
          value = student[fieldKey] || "";

          // Try alternative field names from Excel columns
          if (!value && fieldConfig.excelColumns) {
            for (const excelCol of fieldConfig.excelColumns) {
              if (student[excelCol]) {
                value = student[excelCol];
                break;
              }
              // Try case-insensitive match
              const exactMatch = Object.keys(student).find(
                (key) => key.toLowerCase() === excelCol.toLowerCase(),
              );
              if (exactMatch && student[exactMatch]) {
                value = student[exactMatch];
                break;
              }
            }
          }

          // Try common field name variations
          if (!value) {
            const variations = [
              fieldKey.toLowerCase(),
              fieldKey.replace(/([A-Z])/g, "_$1").toLowerCase(),
              fieldKey.replace(/([A-Z])/g, " $1").toLowerCase(),
              fieldConfig.label?.toLowerCase(),
            ];

            for (const variation of variations) {
              const exactMatch = Object.keys(student).find(
                (key) => key.toLowerCase() === variation,
              );
              if (exactMatch && student[exactMatch]) {
                value = student[exactMatch];
                break;
              }
            }
          }
        }

        // Apply case conversion for display
        if (typeof value === "string" && value.trim() !== "") {
          const emailFields = ["email", "instituteEmail", "personalEmail"];
          if (emailFields.includes(fieldKey)) {
            value = value.toLowerCase();
          } else if (
            [
              "name",
              "fname",
              "mname",
              "address",
              "state",
              "fatherOccupation",
              "motherOccupation",
              "rollNumber",
            ].includes(fieldKey)
          ) {
            value = value.toUpperCase();
          }
        }

        exportRow[fieldConfig.label] = value || "";

        // Skip logging for missing non-critical data
        if (
          !value &&
          ["fname", "mname", "name", "email", "jeeRank"].includes(fieldKey)
        ) {
          // Data validation could be implemented here if needed
        }
      });

      return exportRow;
    });
  };

  const exportToExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();

    // Ensure proper column order with S.No first
    if (data.length > 0) {
      const firstRow = data[0];
      const orderedKeys = [];

      // Always start with S.No
      if (firstRow["S.No"] !== undefined) {
        orderedKeys.push("S.No");
      }

      // Add priority fields in order
      const priorityLabels = [
        "Institute Roll Number",
        "JEE App. No.",
        "Full Name",
        "Institute Email ID",
      ];
      priorityLabels.forEach((label) => {
        if (firstRow[label] !== undefined && !orderedKeys.includes(label)) {
          orderedKeys.push(label);
        }
      });

      // Add remaining fields
      Object.keys(firstRow).forEach((key) => {
        if (!orderedKeys.includes(key)) {
          orderedKeys.push(key);
        }
      });

      // Reorder data with proper column sequence
      const orderedData = data.map((row) => {
        const orderedRow = {};
        orderedKeys.forEach((key) => {
          orderedRow[key] = row[key] || "";
        });
        return orderedRow;
      });

      const ws = XLSX.utils.json_to_sheet(orderedData, { header: orderedKeys });

      // Auto-fit column widths
      const colWidths = orderedKeys.map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Students");
    } else {
      // Empty data case
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, "Students");
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      const blob = new Blob(["No data to export"], {
        type: "text/csv;charset=utf-8;",
      });
      saveAs(blob, `${filename}.csv`);
      return;
    }

    // Ensure proper column order with S.No first
    const firstRow = data[0];
    const orderedKeys = [];

    // Always start with S.No
    if (firstRow["S.No"] !== undefined) {
      orderedKeys.push("S.No");
    }

    // Add priority fields in order
    const priorityLabels = [
      "Institute Roll Number",
      "JEE App. No.",
      "Full Name",
      "Institute Email ID",
    ];
    priorityLabels.forEach((label) => {
      if (firstRow[label] !== undefined && !orderedKeys.includes(label)) {
        orderedKeys.push(label);
      }
    });

    // Add remaining fields
    Object.keys(firstRow).forEach((key) => {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    });

    const csvContent = [
      orderedKeys.join(","),
      ...data.map((row) =>
        orderedKeys
          .map((header) => {
            const value = row[header] || "";
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
  };

  const handleStudentExport = async () => {
    const selectedFieldKeys = Object.keys(selectedFields).filter(
      (key) => selectedFields[key],
    );

    if (selectedFieldKeys.length === 0) {
      notifications.show({
        title: "No Fields Selected",
        message: "Please select at least one field to export.",
        color: "orange",
      });
      return;
    }

    setIsExporting(true);

    try {
      const filteredStudents = getFilteredStudents();
      const exportData = prepareExportData(filteredStudents, selectedFieldKeys);

      const filename = `${selectedBatch?.programme || "Students"}_${selectedBatch?.discipline || "Export"}_${new Date().toISOString().split("T")[0]}`;

      switch (exportFormat) {
        case "excel":
          exportToExcel(exportData, filename);
          break;
        case "csv":
          exportToCSV(exportData, filename);
          break;
        default:
          throw new Error("Invalid export format");
      }

      notifications.show({
        title: "Export Successful",
        message: `Data exported successfully as ${exportFormat.toUpperCase()}`,
        color: "green",
      });

      setShowExportModal(false);
    } catch (error) {
      notifications.show({
        title: "Export Failed",
        message: "Failed to export data. Please try again.",
        color: "red",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter students based on search query
  const getFilteredStudents = () => {
    if (!studentSearchQuery.trim()) {
      return studentList;
    }

    const query = studentSearchQuery.toLowerCase();
    return studentList.filter((student) => {
      return Object.values(student).some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    });
  };

  // Handle Excel upload completion - Now connected to backend
  // Function to transform extracted data to proper database field names
  const transformDataForDatabase = (studentList) => {
    if (studentList?.length > 0) {
    }

    return studentList.map((student) => {
      const transformedStudent = {};

      // Map each field from the frontend format to the database format
      Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
        const fieldInfo = STUDENT_FIELDS_CONFIG[fieldKey];

        // Try to find the field value from various possible field names
        let fieldValue = student[fieldKey]; // Direct match first

        // If not found, try the Excel column mappings (case-insensitive)
        if (!fieldValue && fieldInfo.excelColumns) {
          for (const excelCol of fieldInfo.excelColumns) {
            // Try exact match first
            if (student[excelCol]) {
              fieldValue = student[excelCol];
              break;
            }
            // Try case-insensitive match
            const exactMatch = Object.keys(student).find(
              (key) => key.toLowerCase() === excelCol.toLowerCase(),
            );
            if (exactMatch && student[exactMatch]) {
              fieldValue = student[exactMatch];
              break;
            }
          }
        }

        // If still not found, try common variations
        if (!fieldValue) {
          const variations = [
            fieldKey.toLowerCase(),
            fieldKey.replace(/([A-Z])/g, "_$1").toLowerCase(),
            fieldKey.replace(/([A-Z])/g, " $1").toLowerCase(),
            fieldInfo.label?.toLowerCase(),
          ];

          for (const variation of variations) {
            if (student[variation]) {
              fieldValue = student[variation];
              break;
            }
          }
        }

        // Set the field value (use empty string instead of undefined to avoid issues)
        transformedStudent[fieldKey] = fieldValue || "";

        // Debug logging for important fields
        if (
          ["phoneNumber", "email", "jeeAppNo", "dob", "jeeRank"].includes(
            fieldKey,
          )
        ) {
        }
      });

      // Apply case conversion rules - use Object.assign to modify the existing object
      Object.assign(
        transformedStudent,
        applyCaseConversion(transformedStudent),
      );

      // Also preserve any additional fields that might be needed
      transformedStudent.id = student.id;
      transformedStudent._validation_error = student._validation_error;

      return transformedStudent;
    });
  };

  const handleExcelUpload = async () => {
    try {
      const dataToUpload = extractedData;

      if (!dataToUpload || dataToUpload.length === 0) {
        notifications.show({
          title: "Error",
          message: "No data to upload. Please process an Excel file first.",
          color: "red",
        });
        return;
      }

      // Transform the data to ensure proper field mapping for database
      const transformedData = transformDataForDatabase(dataToUpload);

      // Call backend API to save students batch with transformed data
      const response = await saveStudentsBatch(transformedData, activeSection);

      if (response.success) {
        const uploadCount =
          response.data.successful_uploads || response.data.saved_count || 0;

        notifications.show({
          title: "Success",
          message: `${uploadCount} students uploaded successfully!`,
          color: "green",
        });

        // Reset states and refresh data
        setShowAddModal(false);
        setAddMode(null);
        setUploadedFile(null);
        setExtractedData([]);
        setProcessedBatchData(null);
        setAllocationSummary(null);
        setShowBatchPreview(false);
        setShowPreview(false);
        fetchBatchData(); // Refresh the batch data
      } else {
        throw new Error(response.message || "Failed to upload students");
      }
    } catch (error) {
      // Parse duplicate error for user-friendly message
      const { title, message } = parseDuplicateError(error, "upload students");

      notifications.show({
        title,
        message,
        color: "red",
        autoClose: 8000,
      });
    }
  };

  // Manual form navigation and submission - Apply batch allocation algorithm
  // Manual form navigation and submission - Now connected to backend
  const nextStep = async () => {
    if (currentStep < 3) {
      // Validate only the current step before proceeding
      const stepErrors = validateCurrentStep(
        manualFormData,
        currentStep,
        !!editingStudent,
      );
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        notifications.show({
          title: "Validation Error",
          message:
            "Please fill all required fields in this step before proceeding",
          color: "red",
        });
        return;
      }
      setErrors({});
      setCurrentStep(currentStep + 1);
    } else {
      try {
        // Final validation before submission - validate required fields (excluding dropdowns in edit mode)
        const finalErrors = validateRequiredFields(
          manualFormData,
          !!editingStudent,
        );
        if (Object.keys(finalErrors).length > 0) {
          setErrors(finalErrors);
          notifications.show({
            title: "Validation Error",
            message: "Please fill all required fields",
            color: "red",
          });
          return;
        }

        // Transform manual form data to database format (same as Excel data)
        const transformedData = transformDataForDatabase([manualFormData]);

        if (editingStudent) {
          // Edit mode - update existing student

          // Remove dropdown fields from update data (keep original DB values)
          const dropdownFields = [
            "gender",
            "category",
            "allottedGender",
            "allottedCategory",
            "pwd",
            "branch",
          ];
          const updateData = { ...transformedData[0] };

          dropdownFields.forEach((field) => {
            delete updateData[field];
            // Also remove any database field variations
            delete updateData[field.toLowerCase()];
            delete updateData[field.toUpperCase()];
          });

          const response = await updateStudent(
            editingStudent.id || editingStudent.student_id,
            updateData,
          );

          if (response.success) {
            notifications.show({
              title: "Success",
              message: `Student updated successfully!`,
              color: "green",
            });

            // Update the student in the current list, preserving dropdown fields
            setStudentList((prev) =>
              prev.map((student) => {
                if (
                  (student.id || student.student_id) ===
                  (editingStudent.id || editingStudent.student_id)
                ) {
                  // Merge updated data while preserving original dropdown field values
                  const dropdownFields = [
                    "gender",
                    "category",
                    "allottedGender",
                    "allottedCategory",
                    "pwd",
                    "branch",
                  ];
                  const updatedStudent = { ...student, ...updateData };

                  // Ensure dropdown fields retain their original values
                  dropdownFields.forEach((field) => {
                    if (student[field] !== undefined) {
                      updatedStudent[field] = student[field];
                    }
                    // Also check for snake_case variations
                    const snakeField = field
                      .replace(/([A-Z])/g, "_$1")
                      .toLowerCase();
                    if (student[snakeField] !== undefined) {
                      updatedStudent[snakeField] = student[snakeField];
                    }
                  });

                  // Update editingStudent state as well for UI consistency
                  setEditingStudent(updatedStudent);

                  return updatedStudent;
                }
                return student;
              }),
            );

            // Reset form and edit state
            setShowAddModal(false);
            setEditingStudent(null);
            setCurrentStep(0);
            setManualFormData(INITIAL_FORM_DATA);
            setErrors({});

            // Close student modal and return to main batch list
            setShowStudentModal(false);
            setSelectedBatch(null);

            // Refresh the main batch overview to reflect any changes
            try {
              const updatedOverview = await fetchAdminBatchesOverview();
              if (updatedOverview.success) {
                // Update the appropriate batch arrays based on data structure
                const batchData = updatedOverview.data;
                if (batchData.ug) setUgBatches(batchData.ug);
                if (batchData.pg) setPgBatches(batchData.pg);
                if (batchData.phd) setPhdBatches(batchData.phd);
              }
            } catch (error) {}

            // Refresh batch data
            fetchBatchData();
          } else {
            throw new Error(response.message || "Failed to update student");
          }
        } else {
          // Add mode - create new student
          const response = await addSingleStudent(
            transformedData[0],
            activeSection,
          );

          if (response.success) {
            notifications.show({
              title: "Success",
              message: `Student added successfully! Roll Number: ${response.data.roll_number}, Institute Email: ${response.data.institute_email}`,
              color: "green",
            });

            // Reset form and refresh data
            setShowAddModal(false);
            setAddMode(null);
            setCurrentStep(0);
            setManualFormData(INITIAL_FORM_DATA);
            setErrors({});
            fetchBatchData(); // Refresh the batch data
          } else {
            throw new Error(response.message || "Failed to add student");
          }
        }
      } catch (error) {
        // Parse duplicate error for user-friendly message
        const operationType = editingStudent ? "update student" : "add student";
        const { title, message } = parseDuplicateError(error, operationType);

        notifications.show({
          title,
          message,
          color: "red",
          autoClose: 8000, // Keep longer for duplicate errors so user can read
        });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setErrors({}); // Clear errors when going back
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle editing total seats for a batch
  const handleEditSeats = (batch) => {
    setEditingBatchId(batch.id);
    setEditTotalSeats(batch.totalSeats.toString());
  };

  // ==================== CRUD OPERATIONS ====================

  // CREATE - Add new batch
  const handleAddBatch = async () => {
    try {
      if (
        !newBatchData.programme ||
        !newBatchData.discipline ||
        !newBatchData.totalSeats
      ) {
        notifications.show({
          title: "Validation Error",
          message: "Please fill all required fields",
          color: "red",
        });
        return;
      }

      const batchToAdd = {
        ...newBatchData,
        year: parseInt(newBatchData.year, 10),
        totalSeats: parseInt(newBatchData.totalSeats, 10),
        filledSeats: 0,
        availableSeats: parseInt(newBatchData.totalSeats, 10),
        programme_type: activeSection,
      };

      // Call backend API to create new batch using the new API function
      const result = await createBatch(batchToAdd);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "New batch created successfully",
          color: "green",
        });

        // Refresh data and close modal
        fetchBatchData();
        setShowAddBatchModal(false);
        setNewBatchData({
          programme: "",
          discipline: "",
          year: getCurrentBatchYear(),
          totalSeats: 60,
        });
      } else {
        throw new Error(result.message || "Failed to create batch");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to create batch",
        color: "red",
      });
    }
  };

  // UPDATE - Start editing a row
  const startEditingRow = (batch) => {
    setEditingRow(batch.id);
    setEditFormData({
      programme: batch.programme,
      discipline: batch.discipline,
      year: batch.year,
      totalSeats: batch.totalSeats,
    });
  };

  // UPDATE - Save edited row
  const saveEditedRow = async () => {
    try {
      const batchDataToUpdate = {
        ...editFormData,
        year: parseInt(editFormData.year, 10),
        totalSeats: parseInt(editFormData.totalSeats, 10),
      };

      // Call backend API to update batch using the new API function
      const result = await updateBatch(editingRow, batchDataToUpdate);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Batch updated successfully",
          color: "green",
        });

        // Refresh data and exit edit mode
        fetchBatchData();
        setEditingRow(null);
        setEditFormData({});
      } else {
        throw new Error(result.message || "Failed to update batch");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update batch",
        color: "red",
      });
    }
  };

  // UPDATE - Cancel editing
  const cancelEditing = () => {
    setEditingRow(null);
    setEditFormData({});
  };

  // DELETE - Confirm delete
  const confirmDeleteBatch = (batchId) => {
    setDeletingBatchId(batchId);
    setShowDeleteConfirm(true);
  };

  // DELETE - Execute delete
  const handleDeleteBatch = async () => {
    try {
      // Call backend API to delete batch using the new API function
      const result = await deleteBatch(deletingBatchId);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Batch deleted successfully",
          color: "green",
        });

        // Refresh data and close confirmation
        fetchBatchData();
        setShowDeleteConfirm(false);
        setDeletingBatchId(null);
      } else {
        throw new Error(result.message || "Failed to delete batch");
      }
    } catch (error) {
      let errorMessage = "Failed to delete batch";

      // Handle different types of errors
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            "Cannot delete batch - it may have associated students or dependencies";
        } else if (error.response.status === 404) {
          errorMessage = "Batch not found";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to delete this batch";
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = "Network error - please check your connection";
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  // Helper function to get programme options based on active section
  const getProgrammeOptions = () => {
    if (activeSection === "ug") {
      return [
        { value: "B.Tech", label: "B.Tech" },
        { value: "B.Des", label: "B.Des" },
      ];
    } else if (activeSection === "pg") {
      return [
        { value: "M.Tech", label: "M.Tech" },
        { value: "M.Des", label: "M.Des" },
      ];
    } else {
      return [{ value: "PhD", label: "PhD" }];
    }
  };

  // Helper function to get discipline options based on programme
  const getDisciplineOptions = (programme) => {
    if (programme === "B.Tech" || programme === "M.Tech") {
      return [
        {
          value: "Computer Science and Engineering",
          label: "Computer Science and Engineering",
        },
        {
          value: "Electronics and Communication Engineering",
          label: "Electronics and Communication Engineering",
        },
        { value: "Mechanical Engineering", label: "Mechanical Engineering" },
        { value: "Smart Manufacturing", label: "Smart Manufacturing" },
      ];
    } else if (programme === "B.Des" || programme === "M.Des") {
      return [{ value: "Design", label: "Design" }];
    } else if (programme === "PhD") {
      return [
        {
          value: "Computer Science and Engineering",
          label: "Computer Science and Engineering",
        },
        {
          value: "Electronics and Communication Engineering",
          label: "Electronics and Communication Engineering",
        },
        { value: "Mechanical Engineering", label: "Mechanical Engineering" },
        { value: "Smart Manufacturing", label: "Smart Manufacturing" },
        { value: "Design", label: "Design" },
      ];
    }
    return [];
  };

  // ==================== END CRUD OPERATIONS ====================

  // Generate Excel template with all unified fields
  const generateExcelTemplate = () => {
    // Use your exact Excel column headers
    const headers = [
      "Sno",
      "Jee Main Application Number",
      "Institute Roll Number",
      "Name",
      "Discipline",
      "Gender",
      "Category",
      "PwD",
      "MobileNo",
      "Institute Email ID",
      "Alternet Email ID",
      "Father's Name",
      "Father's Occupation",
      "Father Mobile Number",
      "Mother's Name",
      "Mother's Occupation",
      "Mother Mobile Number",
      "Date of Birth",
      "AI rank",
      "Category Rank",
      "allottedcat",
      "Allotted Gender",
      "State",
      "Full Address",
    ];

    // Indian dummy data samples
    const sampleData = [
      [
        1,
        "240310030189",
        "25BCS001",
        "PRAJJWAL ARAS",
        "Computer Science and Engineering (4 Years, Bachelor of Technology)",
        "Male",
        "General",
        "NO",
        "9229109424",
        "25bcs001@iiitdmj.ac.in",
        "PRAJJWAL.ARAS15@GMAIL.COM",
        "SACHIN ARAS",
        "Business",
        "1234567890",
        "SNIGDHA ARAS",
        "Teacher",
        "1234567890",
        "5/10/2005",
        "10,356",
        "10,356",
        "OPNO",
        "Gender-Neutral",
        "MADHYA PRADESH",
        "A 902 sterling skyline near mayank blue water park, indore, NA, Indore, MADHYA PRADESH, 452016",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Data Template");

    // Set column widths for better readability
    const colWidths = headers.map((header) => ({
      wch: Math.max(header.length, 20),
    }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(
      workbook,
      `student_data_template_${activeSection.toUpperCase()}.xlsx`,
    );

    notifications.show({
      title: "Template Downloaded",
      message: `Excel template with Indian sample data for ${activeSection.toUpperCase()} students has been downloaded`,
      color: "green",
    });
  };

  const handleCancelEdit = () => {
    setEditingBatchId(null);
    setEditTotalSeats("");
  };

  const handleSaveSeats = async (batch) => {
    const newTotalSeats = parseInt(editTotalSeats, 10);

    if (!editTotalSeats || Number.isNaN(newTotalSeats) || newTotalSeats < 0) {
      notifications.show({
        title: "Error",
        message: "Please enter a valid positive number for total seats",
        color: "red",
      });
      return;
    }

    if (newTotalSeats < batch.filledSeats) {
      notifications.show({
        title: "Warning",
        message: `Total seats (${newTotalSeats}) cannot be less than filled seats (${batch.filledSeats}). This would create a negative available seats scenario.`,
        color: "orange",
      });
      return;
    }

    setSeatsUpdateLoading(true);
    try {
      // Call backend API to set total seats using the new API function
      const result = await setTotalSeats({
        programme: batch.programme,
        discipline: batch.discipline,
        year: batch.year,
        totalSeats: newTotalSeats,
      });

      if (result.success) {
        // Update the batch data in state
        const updateBatches = (batches) => {
          return batches.map((b) => {
            if (b.id === batch.id) {
              const availableSeats = Math.max(0, newTotalSeats - b.filledSeats);
              return {
                ...b,
                totalSeats: newTotalSeats,
                availableSeats: availableSeats,
              };
            }
            return b;
          });
        };

        // Update the appropriate batches array
        if (activeSection === PROGRAMME_TYPES.UG) {
          setUgBatches((prev) => updateBatches(prev));
        } else if (activeSection === PROGRAMME_TYPES.PG) {
          setPgBatches((prev) => updateBatches(prev));
        } else if (activeSection === PROGRAMME_TYPES.PHD) {
          setPhdBatches((prev) => updateBatches(prev));
        }

        notifications.show({
          title: "Success",
          message: `Total seats updated to ${newTotalSeats} for ${batch.programme} - ${batch.discipline}`,
          color: "green",
        });

        // Reset editing state
        setEditingBatchId(null);
        setEditTotalSeats("");
      } else {
        throw new Error(result.message || "Failed to update total seats");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update total seats",
        color: "red",
      });
    } finally {
      setSeatsUpdateLoading(false);
    }
  };

  // Handle batch row click to show student list
  const handleBatchRowClick = (batch) => {
    setSelectedBatch(batch);
    const students = batch.students || [];

    // Debug: Log student data structure to see available fields
    if (students.length > 0) {
    }

    setStudentList(students);
    setShowStudentModal(true);
  };

  // Handle reported status toggle for students
  const handleReportedStatusToggle = async (studentId, currentStatus) => {
    setUpdatingReportStatus(studentId);

    try {
      const newStatus =
        currentStatus === "REPORTED" ? "NOT_REPORTED" : "REPORTED";

      const requestData = {
        studentId: studentId,
        reportedStatus: newStatus,
      };

      const result = await updateStudentStatus(requestData);

      if (result.success) {
        // Update student list state
        setStudentList((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, reportedStatus: newStatus }
              : student,
          ),
        );

        // Also update the batch data in main state
        const updateBatchStudents = (batches) => {
          return batches.map((batch) => {
            if (batch.id === selectedBatch.id) {
              return {
                ...batch,
                students: batch.students.map((student) =>
                  student.id === studentId
                    ? { ...student, reportedStatus: newStatus }
                    : student,
                ),
              };
            }
            return batch;
          });
        };

        if (activeSection === PROGRAMME_TYPES.UG) {
          setUgBatches((prev) => updateBatchStudents(prev));
        } else if (activeSection === PROGRAMME_TYPES.PG) {
          setPgBatches((prev) => updateBatchStudents(prev));
        } else if (activeSection === PROGRAMME_TYPES.PHD) {
          setPhdBatches((prev) => updateBatchStudents(prev));
        }

        notifications.show({
          title: "Success",
          message: `Student status updated to ${newStatus.replace("_", " ")}`,
          color: "green",
        });
      } else {
        throw new Error(result.message || "Failed to update student status");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update student status. Please try again.",
        color: "red",
      });
    } finally {
      setUpdatingReportStatus(null);
    }
  };

  // Handle export functionality - Now connected to backend
  const handleExport = async () => {
    try {
      notifications.show({
        title: "Export Started",
        message: "Generating student data export...",
        color: "blue",
      });

      // Call backend API to export student data
      const response = await exportStudentData(activeSection, {
        year: getCurrentBatchYear(),
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${activeSection}_students_${getCurrentBatchYear()}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: "Export Complete",
        message: "Student data exported successfully!",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Export Failed",
        message: error.message || "Failed to export student data",
        color: "red",
      });
    }
  };

  // Handle Edit Student
  const handleEditStudent = (student) => {
    // Set the editing student state - useEffect will handle form data mapping
    setEditingStudent(student);

    // Close student list modal and open edit form
    setShowStudentModal(false);
    setShowAddModal(true);
    setAddMode("manual");
    setCurrentStep(0); // Start at Basic Info (step 0)

    notifications.show({
      title: "Edit Mode",
      message: `Editing student: ${student.Name || student.name || "Unknown"}`,
      color: "blue",
    });

    // Debug: Make student data available for console testing
    window.lastEditedStudent = student;
  };

  // Handle Delete Student
  const handleDeleteStudent = async (student) => {
    const studentName =
      student.Name || student.name || student.student_name || "Unknown";
    const studentId = student.id || student.student_id;

    if (!studentId) {
      notifications.show({
        title: "Error",
        message: "Cannot delete student: No valid ID found",
        color: "red",
      });
      return;
    }

    // Store student data and show confirmation modal
    setStudentToDelete({ id: studentId, name: studentName });
    setShowDeleteStudentConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    const { id: studentId, name: studentName } = studentToDelete;
    setDeletingStudent(studentId);

    try {
      // Call the real API to delete the student
      const response = await deleteStudent(studentId);

      if (response.success) {
        // Remove student from the list immediately for better UX
        setStudentList((prev) => {
          const updated = prev.filter(
            (s) => (s.id || s.student_id) !== studentId,
          );
          return updated;
        });

        // Update batch data in main state
        const updateBatchStudents = (batches) => {
          return batches.map((batch) => {
            if (batch.id === selectedBatch.id) {
              const currentCount =
                batch.studentCount || batch.students?.length || 0;
              const updatedBatch = {
                ...batch,
                students: batch.students.filter(
                  (s) => (s.id || s.student_id) !== studentId,
                ),
                studentCount: Math.max(0, currentCount - 1),
              };
              return updatedBatch;
            }
            return batch;
          });
        };

        if (activeSection === PROGRAMME_TYPES.UG) {
          setUgBatches((prev) => updateBatchStudents(prev));
        } else if (activeSection === PROGRAMME_TYPES.PG) {
          setPgBatches((prev) => updateBatchStudents(prev));
        } else if (activeSection === PROGRAMME_TYPES.PHD) {
          setPhdBatches((prev) => updateBatchStudents(prev));
        }

        // Refresh the student list from backend
        if (selectedBatch) {
          await fetchBatchData();
        }

        // Close student modal and return to main batch list
        setShowStudentModal(false);
        setSelectedBatch(null);

        // Refresh the main batch overview to reflect any changes
        try {
          const updatedOverview = await fetchAdminBatchesOverview();
          if (updatedOverview.success) {
            // Update the appropriate batch arrays based on data structure
            const batchData = updatedOverview.data;
            if (batchData.ug) setUgBatches(batchData.ug);
            if (batchData.pg) setPgBatches(batchData.pg);
            if (batchData.phd) setPhdBatches(batchData.phd);
          }
        } catch (refreshError) {}

        notifications.show({
          title: "Success",
          message: `Student "${studentName}" deleted successfully`,
          color: "green",
        });
      } else {
        throw new Error(response.message || "Failed to delete student");
      }
    } catch (error) {
      // Revert the optimistic update if there was an error

      // Check for specific error types and provide better user feedback
      let errorMessage = "Failed to delete student";
      let errorTitle = "Error";

      if (
        error.message &&
        (error.message.includes("foreign key constraint") ||
          error.message.includes("violates foreign key constraint"))
      ) {
        errorTitle = "Cannot Delete Student";
        errorMessage = `Cannot delete student "${studentName}" because they have associated records in the system. This student may be referenced in other modules (Academic, Examination, etc.) or have associated data that must be removed first.`;
      } else if (error.response?.status === 500) {
        errorTitle = "Server Error (500)";
        const serverMessage =
          error.response?.data?.message || error.response?.data?.error || "";

        if (
          serverMessage.toLowerCase().includes("foreign key") ||
          serverMessage.toLowerCase().includes("constraint")
        ) {
          errorMessage = `Cannot delete student "${studentName}" due to database dependencies. This student may be referenced in other modules like Academic Records, Examination Data, or Course Enrollments.`;
        } else if (serverMessage.toLowerCase().includes("integrity")) {
          errorMessage = `Data integrity error: Student "${studentName}" cannot be deleted because they have dependent records in the system.`;
        } else {
          errorMessage = `Server error occurred while deleting student "${studentName}". ${serverMessage ? `Server says: ${serverMessage}` : "Please try again or contact support."}`;
        }
      } else if (error.response?.status === 403) {
        errorTitle = "Permission Denied";
        errorMessage = `You don't have permission to delete student "${studentName}". Please contact your administrator.`;
      } else if (error.response?.status === 404) {
        errorTitle = "Student Not Found";
        errorMessage = `Student "${studentName}" was not found. They may have already been deleted.`;
      } else if (error.response?.status === 400) {
        errorTitle = "Bad Request";
        errorMessage = `Invalid request to delete student "${studentName}". ${error.response?.data?.message || "Please check the data and try again."}`;
      } else {
        errorMessage = `Failed to delete student "${studentName}": ${error.message || "Unknown error"}`;
      }

      notifications.show({
        title: errorTitle,
        message: errorMessage,
        color: "red",
        autoClose: false, // Keep the error message visible longer
      });

      // Force refresh to get current state from backend
      if (selectedBatch) {
        // TODO: Uncomment when backend is ready
        // await fetchStudentList(selectedBatch.id);
      }
    } finally {
      setDeletingStudent(null);
      setShowDeleteStudentConfirm(false);
      setStudentToDelete(null);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customTableStyles }} />
      <Container fluid style={{ padding: "20px", maxWidth: "95vw" }}>
        {/* Section Tabs */}
        <Flex justify="flex-start" align="center" mb={10}>
          <Button
            variant={activeSection === "ug" ? "filled" : "outline"}
            style={{
              marginRight: "10px",
              backgroundColor:
                activeSection === "ug" ? "#3498db" : "transparent",
              color: activeSection === "ug" ? "white" : "#3498db",
              borderColor: "#3498db",
            }}
            onClick={() => setActiveSection("ug")}
          >
            UG: Undergraduate
          </Button>
          <Button
            variant={activeSection === "pg" ? "filled" : "outline"}
            style={{
              marginRight: "10px",
              backgroundColor:
                activeSection === "pg" ? "#3498db" : "transparent",
              color: activeSection === "pg" ? "white" : "#3498db",
              borderColor: "#3498db",
            }}
            onClick={() => setActiveSection("pg")}
          >
            PG: Post Graduate
          </Button>
          <Button
            variant={activeSection === "phd" ? "filled" : "outline"}
            style={{
              backgroundColor:
                activeSection === "phd" ? "#3498db" : "transparent",
              color: activeSection === "phd" ? "white" : "#3498db",
              borderColor: "#3498db",
            }}
            onClick={() => setActiveSection("phd")}
          >
            PhD: Doctor of Philosophy
          </Button>
        </Flex>
        <hr />

        {/* Top Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            marginTop: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Button
              onClick={() => setShowAddModal(true)}
              style={{
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
              }}
              leftSection={<Plus size={16} />}
            >
              Add Students
            </Button>

            <Button
              onClick={() => setShowAddBatchModal(true)}
              variant="outline"
              style={{
                borderColor: "#3498db",
                color: "#3498db",
              }}
              leftSection={<Plus size={16} />}
            >
              Add Batch
            </Button>
          </div>

          {/* Search and Filters */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <TextInput
              placeholder="Search by programme or discipline..."
              icon={<MagnifyingGlass size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: "250px" }}
            />
            <Select
              placeholder="Filter by Programme"
              icon={<Funnel size={16} />}
              data={
                activeSection === "ug"
                  ? [
                      { value: "", label: "All Programmes" },
                      { value: "B.Tech", label: "B.Tech" },
                      { value: "B.Des", label: "B.Des" },
                    ]
                  : [
                      { value: "", label: "All Programmes" },
                      { value: "M.Tech", label: "M.Tech" },
                      { value: "M.Des", label: "M.Des" },
                      { value: "PhD", label: "PhD" },
                    ]
              }
              value={filterProgramme}
              onChange={setFilterProgramme}
              style={{ minWidth: 150 }}
            />

            {/* Academic Year Indicator */}
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#e7f3ff",
                border: "1px solid #3498db",
                borderRadius: "6px",
                color: "#2c5282",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>📅</span>
              Academic Year: {getCurrentAcademicYear()}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <Grid gutter="md">
          <Grid.Col span={12}>
            <div style={{ backgroundColor: "white", padding: "0px" }}>
              <Table
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  width: "100%",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                        borderRight: "1px solid #d3d3d3",
                      }}
                    >
                      Programme
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                        borderRight: "1px solid #d3d3d3",
                      }}
                    >
                      Branch
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                        borderRight: "1px solid #d3d3d3",
                      }}
                    >
                      Academic Year
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                        borderRight: "1px solid #d3d3d3",
                      }}
                    >
                      Total Seats
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                        borderRight: "1px solid #d3d3d3",
                      }}
                    >
                      Filled Seats
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                      }}
                    >
                      Available Seats
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#C5E2F6",
                        color: "#3498db",
                        fontSize: "16px",
                        textAlign: "center",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((batch) => (
                      <tr
                        key={batch.id}
                        style={{
                          cursor:
                            editingRow === batch.id ? "default" : "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                        onClick={
                          editingRow === batch.id
                            ? undefined
                            : () => handleBatchRowClick(batch)
                        }
                        onMouseEnter={
                          editingRow === batch.id
                            ? undefined
                            : (e) =>
                                (e.target.closest("tr").style.backgroundColor =
                                  "#f8f9fa")
                        }
                        onMouseLeave={
                          editingRow === batch.id
                            ? undefined
                            : (e) =>
                                (e.target.closest("tr").style.backgroundColor =
                                  "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: "black",
                            borderRight: "1px solid #d3d3d3",
                          }}
                        >
                          {editingRow === batch.id ? (
                            <Select
                              value={editFormData.programme}
                              onChange={(value) =>
                                setEditFormData({
                                  ...editFormData,
                                  programme: value,
                                })
                              }
                              data={getProgrammeOptions()}
                              size="sm"
                              style={{ minWidth: "120px" }}
                            />
                          ) : (
                            batch.programme
                          )}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: "black",
                            borderRight: "1px solid #d3d3d3",
                          }}
                        >
                          {editingRow === batch.id ? (
                            <Select
                              value={editFormData.discipline}
                              onChange={(value) =>
                                setEditFormData({
                                  ...editFormData,
                                  discipline: value,
                                })
                              }
                              data={getDisciplineOptions(
                                editFormData.programme,
                              )}
                              size="sm"
                              style={{ minWidth: "200px" }}
                            />
                          ) : (
                            <Badge variant="light" color="blue">
                              {batch.displayBranch ||
                                getDisplayBranchName(batch.discipline)}
                            </Badge>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: "black",
                            borderRight: "1px solid #d3d3d3",
                          }}
                        >
                          {editingRow === batch.id ? (
                            <TextInput
                              value={editFormData.year}
                              onChange={(event) =>
                                setEditFormData({
                                  ...editFormData,
                                  year: event.currentTarget.value,
                                })
                              }
                              size="sm"
                              style={{ width: "100px" }}
                              type="number"
                              min="2020"
                              max="2030"
                            />
                          ) : (
                            getCurrentAcademicYear()
                          )}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: "black",
                            fontWeight: "500",
                            borderRight: "1px solid #d3d3d3",
                          }}
                        >
                          {editingRow === batch.id ? (
                            <TextInput
                              value={editFormData.totalSeats}
                              onChange={(event) =>
                                setEditFormData({
                                  ...editFormData,
                                  totalSeats: event.currentTarget.value,
                                })
                              }
                              size="sm"
                              style={{ width: "100px" }}
                              type="number"
                              min="0"
                              max="500"
                            />
                          ) : (
                            <Text weight={500}>{batch.totalSeats}</Text>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: "black",
                            borderRight: "1px solid #d3d3d3",
                          }}
                        >
                          {batch.filledSeats}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: batch.availableSeats > 0 ? "green" : "red",
                            fontWeight: "500",
                            borderRight: "1px solid #d3d3d3",
                          }}
                        >
                          {batch.availableSeats}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {editingRow === batch.id ? (
                            // Show save/cancel buttons when editing
                            <Flex
                              direction="row"
                              justify="center"
                              align="center"
                              gap="xs"
                            >
                              <ActionIcon
                                color="green"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click event
                                  saveEditedRow();
                                }}
                                title="Save changes"
                              >
                                <Check size={16} />
                              </ActionIcon>
                              <ActionIcon
                                color="red"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent row click event
                                  cancelEditing();
                                }}
                                title="Cancel editing"
                              >
                                <X size={16} />
                              </ActionIcon>
                            </Flex>
                          ) : (
                            // Show CRUD action buttons when not editing
                            <Flex
                              direction="row"
                              justify="center"
                              align="center"
                              gap="xs"
                            >
                              <Tooltip
                                label="Edit Batch"
                                position="top"
                                withArrow
                              >
                                <ActionIcon
                                  color="blue"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    startEditingRow(batch);
                                  }}
                                  variant="light"
                                  title="Edit this batch"
                                >
                                  <PencilSimple size={16} />
                                </ActionIcon>
                              </Tooltip>

                              <Tooltip
                                label="Delete Batch"
                                position="top"
                                withArrow
                              >
                                <ActionIcon
                                  color="red"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    confirmDeleteBatch(batch.id);
                                  }}
                                  variant="light"
                                  title="Delete this batch"
                                >
                                  <X size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Flex>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        style={{
                          padding: "30px",
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        {loading
                          ? "Loading batch data..."
                          : "No batches found matching your criteria"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Grid.Col>
        </Grid>

        {/* Add Students Modal */}
        <Modal
          opened={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setAddMode(null);
            setCurrentStep(0);
            setShowPreview(false);
            setExtractedData([]);
            setUploadedFile(null);
            setProcessedBatchData(null);
            setAllocationSummary(null);
            setShowBatchPreview(false);
          }}
          closeOnClickOutside={false}
          size="90vw"
          centered
          padding="md"
          radius="md"
          shadow="xl"
          styles={{
            modal: {
              maxWidth: isMobile ? "95vw" : "90vw",
              width: isMobile ? "95vw" : "90vw",
              maxHeight: isMobile ? "95vh" : "85vh",
              height: "auto",
              minHeight: "50vh",
              margin: "0 auto",
            },
            body: {
              padding: isMobile ? "8px" : "15px",
              paddingTop: isMobile ? "0px" : "5px",
              maxHeight: isMobile ? "85vh" : "75vh",
              overflow: "auto",
            },
            header: {
              padding: isMobile ? "8px 8px 0" : "12px 15px 0",
              borderBottom: "none",
            },
            close: {
              marginTop: "4px",
            },
          }}
        >
          {!addMode && (
            <Container size="lg" style={{ padding: 0 }}>
              <Stack spacing={isMobile ? "md" : "lg"} align="center">
                <Text
                  size={isMobile ? "lg" : "xl"}
                  ta="center"
                  color="#3498db"
                  weight={700}
                  style={{
                    fontSize: isMobile ? "18px" : "24px",
                    fontWeight: "bold",
                    marginBottom: isMobile ? "5px" : "8px",
                    marginTop: "0",
                  }}
                >
                  Select Student Data Entry Method
                </Text>

                <Text
                  size={isMobile ? "xs" : "sm"}
                  ta="center"
                  color="dimmed"
                  style={{
                    marginBottom: isMobile ? "5px" : "10px",
                    lineHeight: 1.3,
                  }}
                >
                  Choose your preferred method to add student information to the
                  system
                </Text>

                {/* Field Synchronization Alert */}
                <Alert
                  color="green"
                  icon={<Check size={16} />}
                  style={{ width: "100%" }}
                >
                  <Text size="sm" weight={600}>
                    ✅ Synchronized Field Structure
                  </Text>
                  <Text size="xs" mt={4}>
                    Both Excel import and manual entry now use the same{" "}
                    {Object.keys(STUDENT_FIELDS_CONFIG).length} fields. Any data
                    entered through either method will have the same structure
                    and compatibility.
                  </Text>
                </Alert>

                <Grid
                  gutter={isMobile ? "md" : "lg"}
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  <Grid.Col span={isMobile ? 12 : 6}>
                    <Card
                      shadow="sm"
                      radius="lg"
                      padding={isMobile ? "md" : "xl"}
                      style={{
                        height: isMobile ? "180px" : "240px",
                        cursor: "pointer",
                        border: "2px solid transparent",
                        transition: "all 0.3s ease",
                      }}
                      onClick={() => setAddMode("excel")}
                      sx={(theme) => ({
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 32px rgba(52, 152, 219, 0.15)",
                          borderColor: "#3498db",
                        },
                      })}
                    >
                      <Stack
                        align="center"
                        spacing="xs"
                        h="100%"
                        justify="center"
                      >
                        <ThemeIcon
                          size={isMobile ? 40 : 50}
                          radius="xl"
                          variant="light"
                          color="blue"
                        >
                          <FileXls size={isMobile ? 20 : 24} />
                        </ThemeIcon>
                        <Text size={isMobile ? "sm" : "md"} weight={600} mt={4}>
                          Excel Upload
                        </Text>
                        <Text
                          ta="center"
                          color="dimmed"
                          size="xs"
                          style={{ lineHeight: 1.3 }}
                        >
                          Upload Excel file to automatically extract and import
                          student data
                        </Text>
                        <Badge
                          color="green"
                          size={isMobile ? "xs" : "sm"}
                          mt={4}
                        >
                          AUTOMATED
                        </Badge>
                      </Stack>
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={isMobile ? 12 : 6}>
                    <Card
                      shadow="sm"
                      radius="lg"
                      padding={isMobile ? "md" : "xl"}
                      style={{
                        height: isMobile ? "180px" : "240px",
                        cursor: "pointer",
                        border: "2px solid transparent",
                        transition: "all 0.3s ease",
                      }}
                      onClick={() => setAddMode("manual")}
                      sx={(theme) => ({
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 32px rgba(52, 152, 219, 0.15)",
                          borderColor: "#3498db",
                        },
                      })}
                    >
                      <Stack
                        align="center"
                        spacing="xs"
                        h="100%"
                        justify="center"
                      >
                        <ThemeIcon
                          size={isMobile ? 40 : 50}
                          radius="xl"
                          variant="light"
                          color="blue"
                        >
                          <Users size={isMobile ? 20 : 24} />
                        </ThemeIcon>
                        <Text size={isMobile ? "sm" : "md"} weight={600} mt={4}>
                          Manual Entry
                        </Text>
                        <Text
                          ta="center"
                          color="dimmed"
                          size="xs"
                          style={{ lineHeight: 1.3 }}
                        >
                          Enter student details manually using step-by-step form
                        </Text>
                        <Badge
                          color="blue"
                          size={isMobile ? "xs" : "sm"}
                          mt={4}
                        >
                          STEP BY STEP
                        </Badge>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Container>
          )}

          {/* Excel Upload Mode */}
          {addMode === "excel" && (
            <Container size="lg" style={{ padding: 0 }}>
              <Stack spacing={isMobile ? "md" : "lg"}>
                <Group
                  position="apart"
                  style={{ marginBottom: isMobile ? "16px" : "24px" }}
                >
                  <Text
                    size={isMobile ? "md" : "lg"}
                    weight={700}
                    style={{
                      fontWeight: "bold",
                      color: "#2c3e50",
                      fontSize: isMobile ? "18px" : "22px",
                    }}
                  >
                    Excel Upload Mode
                  </Text>
                  <Button
                    variant="subtle"
                    size={isMobile ? "xs" : "sm"}
                    onClick={() => {
                      setAddMode(null);
                      setShowPreview(false);
                      setExtractedData([]);
                      setUploadedFile(null);
                      setProcessedBatchData(null);
                      setAllocationSummary(null);
                      setShowBatchPreview(false);
                    }}
                  >
                    <CaretLeft size={16} style={{ marginRight: "8px" }} />
                    Back
                  </Button>
                </Group>

                <Card
                  shadow="sm"
                  padding={isMobile ? "md" : "xl"}
                  radius="md"
                  style={{ border: "1px solid #e9ecef" }}
                >
                  <Stack spacing="md">
                    {/* Template Download Section */}
                    <div
                      style={{
                        backgroundColor: "#e3f2fd",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #2196f3",
                      }}
                    >
                      <Group position="apart" align="center">
                        <div>
                          <Text size="sm" weight={600} color="#1976d2">
                            📄 Download Excel Template
                          </Text>
                          <Text size="xs" color="#1976d2" mt={2}>
                            Download the standardized template with all required
                            fields for {activeSection.toUpperCase()} students
                          </Text>
                        </div>
                        <Button
                          size="sm"
                          variant="light"
                          color="blue"
                          leftSection={<Download size={16} />}
                          onClick={generateExcelTemplate}
                        >
                          Download Template
                        </Button>
                      </Group>
                    </div>

                    <FileInput
                      label="Upload Excel File"
                      description="Select an Excel file (.xlsx, .xls) containing student data using the template format"
                      placeholder="Click to select file"
                      icon={<Upload size={14} />}
                      value={uploadedFile}
                      onChange={handleFileUpload}
                      accept=".xlsx,.xls"
                    />

                    {isProcessing && (
                      <Stack spacing="xs">
                        <Text size="sm">Processing file...</Text>
                        <Progress value={uploadProgress} />
                      </Stack>
                    )}

                    {showBatchPreview &&
                      processedBatchData &&
                      !isProcessing && (
                        <Stack spacing="md">
                          <Alert color="green" icon={<Check size={16} />}>
                            Batch allocation completed!{" "}
                            {processedBatchData?.length || 0} students processed
                            with roll numbers and institute emails.
                          </Alert>

                          {allocationSummary && (
                            <Card
                              withBorder
                              padding="md"
                              style={{ backgroundColor: "#f8f9fa" }}
                            >
                              <Text
                                size="md"
                                weight={600}
                                color="#3498db"
                                mb="sm"
                              >
                                📊 Allocation Summary:
                              </Text>
                              <Grid>
                                <Grid.Col span={6}>
                                  <Text size="sm">
                                    <strong>Programme:</strong>{" "}
                                    {allocationSummary.programme || "N/A"}
                                  </Text>
                                  <Text size="sm">
                                    <strong>Year:</strong>{" "}
                                    {allocationSummary.year || "N/A"}
                                  </Text>
                                  <Text size="sm">
                                    <strong>Total Students:</strong>{" "}
                                    {allocationSummary.totalStudents || 0}
                                  </Text>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                  <Text size="sm" weight={600} mb="xs">
                                    Branch-wise Distribution:
                                  </Text>
                                  {allocationSummary.branchCounts &&
                                    typeof allocationSummary.branchCounts ===
                                      "object" &&
                                    Object.entries(
                                      allocationSummary.branchCounts,
                                    ).map(([branch, count]) => (
                                      <Text key={branch} size="sm">
                                        <Badge variant="light" mr="xs">
                                          {branch}
                                        </Badge>
                                        {count} students
                                      </Text>
                                    ))}
                                  {(!allocationSummary.branchCounts ||
                                    typeof allocationSummary.branchCounts !==
                                      "object") && (
                                    <Text size="sm" color="dimmed">
                                      No branch distribution available
                                    </Text>
                                  )}
                                </Grid.Col>
                              </Grid>
                            </Card>
                          )}

                          <Text size="md" weight={600} color="#3498db" mt="md">
                            🎓 Student Allocation Preview:
                          </Text>

                          <div
                            style={{
                              maxHeight: "400px",
                              overflowY: "auto",
                              overflowX: "auto",
                              border: "1px solid #e0e0e0",
                              borderRadius: "8px",
                            }}
                          >
                            <Table
                              striped
                              highlightOnHover
                              className="student-allocation-table"
                              style={{
                                minWidth: "1400px",
                                tableLayout: "fixed",
                                width: "100%",
                              }}
                            >
                              <thead>
                                <tr>
                                  <th
                                    style={{
                                      width: "120px",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Roll Number
                                  </th>
                                  <th style={{ width: "140px" }}>Name</th>
                                  <th style={{ width: "140px" }}>
                                    Father Name
                                  </th>
                                  <th style={{ width: "140px" }}>
                                    Mother Name
                                  </th>
                                  <th style={{ width: "200px" }}>Address</th>
                                  <th style={{ width: "130px" }}>
                                    JEE App. No.
                                  </th>
                                  <th style={{ width: "100px" }}>
                                    Branch Code
                                  </th>
                                  <th style={{ width: "180px" }}>
                                    Institute Email
                                  </th>
                                  <th style={{ width: "120px" }}>Password</th>
                                  <th style={{ width: "80px" }}>Category</th>
                                  <th style={{ width: "60px" }}>PWD</th>
                                </tr>
                              </thead>
                              <tbody>
                                {processedBatchData.map((student, index) => (
                                  <tr key={index}>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        whiteSpace: "nowrap",
                                        overflow: "visible",
                                      }}
                                    >
                                      <Badge
                                        color="blue"
                                        variant="light"
                                        style={{
                                          fontSize: "11px",
                                          minWidth: "fit-content",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {student.rollNumber}
                                      </Badge>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        wordWrap: "break-word",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {student.name}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        wordWrap: "break-word",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {student.fname}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        wordWrap: "break-word",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {student.mname || "N/A"}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "11px",
                                        wordWrap: "break-word",
                                        lineHeight: "1.3",
                                        maxWidth: "200px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        position: "relative",
                                      }}
                                    >
                                      <Tooltip
                                        label={student.address || "N/A"}
                                        multiline
                                        width={300}
                                        disabled={
                                          !student.address ||
                                          student.address.length < 50
                                        }
                                      >
                                        <div
                                          style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {student.address || "N/A"}
                                        </div>
                                      </Tooltip>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {student.jeeAppNo || "N/A"}
                                    </td>
                                    <td style={{ padding: "8px 12px" }}>
                                      <Badge
                                        color="green"
                                        variant="light"
                                        style={{
                                          fontSize: "11px",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {student.branchCode}
                                      </Badge>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "11px",
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                      }}
                                    >
                                      {student.instituteEmail}
                                    </td>
                                    <td style={{ padding: "8px 12px" }}>
                                      <Badge
                                        color="orange"
                                        variant="light"
                                        style={{
                                          fontSize: "10px",
                                          fontFamily: "monospace",
                                          minWidth: "fit-content",
                                          whiteSpace: "nowrap",
                                          cursor: "pointer",
                                        }}
                                        title={`Full password: ${student.password}`}
                                      >
                                        {student.password}
                                      </Badge>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                      }}
                                    >
                                      {student.category}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                        textAlign: "center",
                                      }}
                                    >
                                      {student.pwd}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>

                          {/* Important Save Reminder */}
                          <Alert
                            color="orange"
                            icon={<Warning size={16} />}
                            styles={{
                              root: {
                                border: "2px solid #f59e0b",
                                backgroundColor: "#fef3c7",
                              },
                              title: { color: "#92400e", fontWeight: 600 },
                              message: { color: "#92400e" },
                            }}
                          >
                            <Text weight={600} size="md">
                              ⚠️ IMPORTANT: Data Not Saved Yet!
                            </Text>
                            <Text size="sm" mt={4}>
                              The students have been processed but{" "}
                              <strong>NOT YET SAVED</strong> to the database.
                              Click "Save Students" below to permanently add
                              them to the system.
                            </Text>
                          </Alert>

                          <Group position="center" mt="lg" spacing="md">
                            <Button
                              variant="outline"
                              color="blue"
                              onClick={() => {
                                setShowBatchPreview(false);
                                setProcessedBatchData(null);
                                setAllocationSummary(null);
                                setExtractedData([]);
                              }}
                            >
                              ← Back to Upload
                            </Button>
                            <Button
                              onClick={handleExcelUpload}
                              size="md"
                              style={{
                                backgroundColor: "#e74c3c",
                                fontSize: "16px",
                                padding: "12px 24px",
                                boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)",
                              }}
                            >
                              <Upload
                                size={16}
                                style={{ marginRight: "8px" }}
                              />
                              💾 SAVE STUDENTS TO DATABASE
                            </Button>
                          </Group>
                        </Stack>
                      )}

                    {/* Data Preview Section - After Excel Processing */}
                    {extractedData &&
                      extractedData.length > 0 &&
                      showPreview &&
                      !isProcessing &&
                      !showBatchPreview && (
                        <Stack spacing="md">
                          <Alert color="green" icon={<Check size={16} />}>
                            ✅ Excel file processed successfully!{" "}
                            {extractedData.length} records found.
                            {extractedData.filter((s) => !s._validation_error)
                              .length > 0 &&
                              ` (${extractedData.filter((s) => !s._validation_error).length} valid)`}
                            {extractedData.filter((s) => s._validation_error)
                              .length > 0 &&
                              ` (${extractedData.filter((s) => s._validation_error).length} need attention)`}
                          </Alert>

                          {/* Discipline Summary */}
                          <Card
                            withBorder
                            padding="md"
                            style={{ backgroundColor: "#e8f5e8" }}
                          >
                            <Text
                              size="md"
                              weight={600}
                              color="#2d8659"
                              mb="sm"
                            >
                              📊 Discipline-wise Distribution:
                            </Text>
                            <Grid>
                              {Object.entries(
                                extractedData.reduce((groups, student) => {
                                  const discipline =
                                    student.discipline || "Unknown";
                                  groups[discipline] =
                                    (groups[discipline] || 0) + 1;
                                  return groups;
                                }, {}),
                              ).map(([discipline, count]) => (
                                <Grid.Col span={6} key={discipline}>
                                  <Text size="sm">
                                    <strong>{discipline}:</strong> {count}{" "}
                                    students
                                  </Text>
                                </Grid.Col>
                              ))}
                            </Grid>
                            <Text size="xs" color="dimmed" mt="sm">
                              💡 Students will be saved in separate branches
                              based on their discipline within the same batch.
                            </Text>
                          </Card>

                          <Card
                            withBorder
                            padding="md"
                            style={{ backgroundColor: "#f8f9fa" }}
                          >
                            <Text
                              size="md"
                              weight={600}
                              color="#3498db"
                              mb="sm"
                            >
                              📋 Data Preview ({extractedData.length} students):
                            </Text>

                            <ScrollArea style={{ height: 400 }}>
                              <Table striped highlightOnHover fontSize="sm">
                                <thead>
                                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th style={{ minWidth: "60px" }}>Sno</th>
                                    <th style={{ minWidth: "150px" }}>
                                      Jee Main Application Number
                                    </th>
                                    <th style={{ minWidth: "120px" }}>
                                      Institute Roll Number
                                    </th>
                                    <th style={{ minWidth: "200px" }}>Name</th>
                                    <th style={{ minWidth: "100px" }}>
                                      Discipline
                                    </th>
                                    <th style={{ minWidth: "80px" }}>Gender</th>
                                    <th style={{ minWidth: "80px" }}>
                                      Category
                                    </th>
                                    <th style={{ minWidth: "60px" }}>PWD</th>
                                    <th style={{ minWidth: "120px" }}>
                                      Mobile No
                                    </th>
                                    <th style={{ minWidth: "200px" }}>
                                      Institute Email ID
                                    </th>
                                    <th style={{ minWidth: "200px" }}>
                                      Alternate Email ID
                                    </th>
                                    <th style={{ minWidth: "150px" }}>
                                      Father's Name
                                    </th>
                                    <th style={{ minWidth: "150px" }}>
                                      Father's Occupation
                                    </th>
                                    <th style={{ minWidth: "120px" }}>
                                      Father Mobile Number
                                    </th>
                                    <th style={{ minWidth: "150px" }}>
                                      Mother's Name
                                    </th>
                                    <th style={{ minWidth: "150px" }}>
                                      Mother's Occupation
                                    </th>
                                    <th style={{ minWidth: "120px" }}>
                                      Mother Mobile Number
                                    </th>
                                    <th style={{ minWidth: "100px" }}>
                                      Date of Birth
                                    </th>
                                    <th style={{ minWidth: "80px" }}>
                                      AI rank
                                    </th>
                                    <th style={{ minWidth: "100px" }}>
                                      Category Rank
                                    </th>
                                    <th style={{ minWidth: "100px" }}>
                                      allotedcat
                                    </th>
                                    <th style={{ minWidth: "120px" }}>
                                      Allotted Gender
                                    </th>
                                    <th style={{ minWidth: "100px" }}>State</th>
                                    <th style={{ minWidth: "200px" }}>
                                      Full Address
                                    </th>
                                    {extractedData.some(
                                      (student) => student._validation_error,
                                    ) && (
                                      <th
                                        style={{
                                          minWidth: "200px",
                                          color: "#e74c3c",
                                        }}
                                      >
                                        Validation Status
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {extractedData
                                    .slice(0, 10)
                                    .map((student, index) => (
                                      <tr
                                        key={index}
                                        style={
                                          student._validation_error
                                            ? { backgroundColor: "#fff3cd" }
                                            : {}
                                        }
                                      >
                                        <td>
                                          {student._row_number ||
                                            student.sno ||
                                            index + 1}
                                        </td>
                                        <td>
                                          {student.jee_main_application_number ||
                                            student.jee_app_no ||
                                            student[
                                              "Jee Main Application Number"
                                            ] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.institute_roll_number ||
                                            student.roll_number ||
                                            student["Institute Roll Number"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.name ||
                                            student["Name"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.discipline ||
                                            student.branch ||
                                            student["Discipline"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.gender ||
                                            student["Gender"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.category ||
                                            student["Category"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.pwd ||
                                            student.pwd_status ||
                                            student["PwD"] ||
                                            student["PWD"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.mobile_number ||
                                            student.phone_number ||
                                            student.mobile_no ||
                                            student["MobileNo"] ||
                                            student["Mobile No"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.institute_email ||
                                            student["Institute Email ID"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.alternate_email ||
                                            student.personal_email ||
                                            student["Alternet Email ID"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.father_name ||
                                            student["Father's Name"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.father_occupation ||
                                            student["Father's Occupation"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.father_mobile ||
                                            student["Father Mobile Number"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.mother_name ||
                                            student["Mother's Name"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.mother_occupation ||
                                            student["Mother's Occupation"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.mother_mobile ||
                                            student["Mother Mobile Number"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.date_of_birth ||
                                            student["Date of Birth"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.ai_rank ||
                                            student["AI rank"] ||
                                            student.jee_rank ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.category_rank ||
                                            student["Category Rank"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.allotted_category ||
                                            student.allotted_category ||
                                            student["allottedcat"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.allotted_gender ||
                                            student["Allotted Gender"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.state ||
                                            student["State"] ||
                                            "-"}
                                        </td>
                                        <td>
                                          {student.full_address ||
                                            student.address ||
                                            student["Full Address"] ||
                                            "-"}
                                        </td>
                                        {student._validation_error && (
                                          <td
                                            style={{
                                              color: "#e74c3c",
                                              fontSize: "11px",
                                            }}
                                          >
                                            ⚠️ {student._validation_error}
                                          </td>
                                        )}
                                      </tr>
                                    ))}
                                  {extractedData.length > 10 && (
                                    <tr>
                                      <td
                                        colSpan={
                                          extractedData.some(
                                            (student) =>
                                              student._validation_error,
                                          )
                                            ? "25"
                                            : "24"
                                        }
                                        style={{
                                          textAlign: "center",
                                          fontStyle: "italic",
                                          backgroundColor: "#f8f9fa",
                                        }}
                                      >
                                        ... and {extractedData.length - 10} more
                                        students
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </Table>
                            </ScrollArea>
                          </Card>

                          <Group
                            position="center"
                            style={{ marginTop: "20px" }}
                          >
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowPreview(false);
                                setExtractedData([]);
                              }}
                              size="md"
                              style={{ fontSize: "16px", padding: "12px 24px" }}
                            >
                              ← Back to Upload
                            </Button>
                            <Button
                              onClick={async () => {
                                try {
                                  setIsProcessing(true);
                                  setShowPreview(false);

                                  // Transform the data to ensure proper field mapping for database
                                  const transformedData =
                                    transformDataForDatabase(extractedData);

                                  // Directly save students to database (with proper field mapping)
                                  const response = await saveStudentsBatch(
                                    transformedData,
                                    activeSection,
                                  );

                                  if (response.success) {
                                    notifications.show({
                                      title: "Success",
                                      message: `${response.data.successful_uploads || response.data.saved_count || extractedData.length} students saved to database successfully!`,
                                      color: "green",
                                    });

                                    // Reset the form and refresh batch data
                                    setExtractedData([]);
                                    setShowPreview(false);
                                    fetchBatchData(); // Refresh the main batch overview
                                  } else {
                                    throw new Error(
                                      response.message ||
                                        "Failed to save students",
                                    );
                                  }
                                } catch (error) {
                                  // Parse duplicate error for user-friendly message
                                  const { title, message } =
                                    parseDuplicateError(
                                      error,
                                      "save students to database",
                                    );

                                  notifications.show({
                                    title,
                                    message,
                                    color: "red",
                                    autoClose: 8000,
                                  });
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              size="md"
                              style={{
                                backgroundColor: "#28a745",
                                fontSize: "16px",
                                padding: "12px 24px",
                              }}
                            >
                              <Database
                                size={16}
                                style={{ marginRight: "8px" }}
                              />
                              Save Students to Database ({extractedData.length})
                            </Button>
                          </Group>
                        </Stack>
                      )}

                    {extractedData &&
                      extractedData.length > 0 &&
                      !isProcessing &&
                      !showBatchPreview &&
                      !showPreview && (
                        <Stack spacing="md">
                          <Alert color="blue" icon={<Info size={16} />}>
                            Raw data extracted. Processing for batch
                            allocation...
                          </Alert>
                        </Stack>
                      )}
                  </Stack>
                </Card>
              </Stack>
            </Container>
          )}

          {/* Manual Entry Mode */}
          {addMode === "manual" && (
            <Container size="lg" style={{ padding: 0 }}>
              <Stack spacing={isMobile ? "md" : "lg"}>
                <Group
                  position="apart"
                  style={{ marginBottom: isMobile ? "16px" : "24px" }}
                >
                  <Text
                    size={isMobile ? "md" : "lg"}
                    weight={700}
                    style={{
                      fontWeight: "bold",
                      color: "#2c3e50",
                      fontSize: isMobile ? "18px" : "22px",
                    }}
                  >
                    {editingStudent ? "Edit Student" : "Manual Entry Mode"}
                  </Text>
                  <Button
                    variant="subtle"
                    size={isMobile ? "xs" : "sm"}
                    onClick={() => {
                      if (editingStudent) {
                        // If we're editing, return to student list
                        setAddMode(null);
                        setEditingStudent(null);
                        setManualFormData(INITIAL_FORM_DATA);
                        setCurrentStep(0);
                        setErrors({});
                        setShowAddModal(false);
                        setShowStudentModal(true);
                      } else {
                        // If we're adding, just close the form
                        setAddMode(null);
                        setEditingStudent(null);
                        setManualFormData(INITIAL_FORM_DATA);
                        setCurrentStep(0);
                        setErrors({});
                        setShowAddModal(false);
                      }
                    }}
                  >
                    <CaretLeft size={16} style={{ marginRight: "8px" }} />
                    Back
                  </Button>
                </Group>

                <Card
                  shadow="sm"
                  padding={isMobile ? "md" : "xl"}
                  radius="md"
                  style={{ border: "1px solid #e9ecef" }}
                >
                  <Stepper active={currentStep} breakpoint="sm">
                    <Stepper.Step
                      label="Basic Info"
                      description="Personal information"
                      icon={<User size={18} />}
                    >
                      <Stack spacing="md" mt="lg">
                        <Title order={3} size="h4" weight={700} mb="md">
                          Basic Info
                        </Title>

                        {/* Name Field */}
                        <TextInput
                          label={STUDENT_FIELDS_CONFIG.name.label}
                          placeholder={STUDENT_FIELDS_CONFIG.name.placeholder}
                          value={manualFormData.name || ""}
                          onChange={(e) =>
                            setManualFormData({
                              ...manualFormData,
                              name: e.target.value,
                            })
                          }
                          required={STUDENT_FIELDS_CONFIG.name.required}
                          error={errors.name}
                        />

                        {/* Parent Names */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.fname.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.fname.placeholder
                              }
                              value={manualFormData.fname || ""}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  fname: e.target.value,
                                })
                              }
                              required={STUDENT_FIELDS_CONFIG.fname.required}
                              error={errors.fname}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.mname.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.mname.placeholder
                              }
                              value={manualFormData.mname || ""}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  mname: e.target.value,
                                })
                              }
                              required={STUDENT_FIELDS_CONFIG.mname.required}
                              error={errors.mname}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* Gender and Category */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            {editingStudent ? (
                              <div>
                                <Text size="sm" weight={500} mb={5}>
                                  {STUDENT_FIELDS_CONFIG.gender.label}{" "}
                                  (Read-only)
                                </Text>
                                <Text
                                  size="sm"
                                  p="xs"
                                  style={{
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    backgroundColor: "#f8f9fa",
                                    color: "#6c757d",
                                  }}
                                >
                                  {editingStudent.gender ||
                                    editingStudent.Gender ||
                                    "Not specified"}
                                </Text>
                              </div>
                            ) : (
                              <Select
                                label={STUDENT_FIELDS_CONFIG.gender.label}
                                placeholder={
                                  STUDENT_FIELDS_CONFIG.gender.placeholder
                                }
                                value={manualFormData.gender}
                                onChange={(value) =>
                                  setManualFormData({
                                    ...manualFormData,
                                    gender: value,
                                  })
                                }
                                data={STUDENT_FIELDS_CONFIG.gender.options}
                                required={STUDENT_FIELDS_CONFIG.gender.required}
                                error={errors.gender}
                              />
                            )}
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            {editingStudent ? (
                              <div>
                                <Text size="sm" weight={500} mb={5}>
                                  {STUDENT_FIELDS_CONFIG.category.label}{" "}
                                  (Read-only)
                                </Text>
                                <Text
                                  size="sm"
                                  p="xs"
                                  style={{
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    backgroundColor: "#f8f9fa",
                                    color: "#6c757d",
                                  }}
                                >
                                  {editingStudent.category ||
                                    editingStudent.Category ||
                                    "Not specified"}
                                </Text>
                              </div>
                            ) : (
                              <Select
                                label={STUDENT_FIELDS_CONFIG.category.label}
                                placeholder={
                                  STUDENT_FIELDS_CONFIG.category.placeholder
                                }
                                value={manualFormData.category}
                                onChange={(value) =>
                                  setManualFormData({
                                    ...manualFormData,
                                    category: value,
                                  })
                                }
                                data={STUDENT_FIELDS_CONFIG.category.options}
                                required={
                                  STUDENT_FIELDS_CONFIG.category.required
                                }
                                error={errors.category}
                              />
                            )}
                          </Grid.Col>
                        </Grid>

                        {/* Contact Information */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.phoneNumber.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.phoneNumber.placeholder
                              }
                              value={manualFormData.phoneNumber || ""}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  phoneNumber: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.phoneNumber.required
                              }
                              error={errors.phoneNumber}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              type="email"
                              label={STUDENT_FIELDS_CONFIG.email.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.email.placeholder
                              }
                              value={manualFormData.email || ""}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  email: e.target.value,
                                })
                              }
                              required={STUDENT_FIELDS_CONFIG.email.required}
                              error={errors.email}
                            />
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Stepper.Step>

                    <Stepper.Step
                      label="Additional Info"
                      description="PWD, JEE & Address details"
                      icon={<GraduationCap size={18} />}
                    >
                      <Stack spacing="md" mt="lg">
                        <Title order={3} size="h4" weight={700} mb="md">
                          Additional Info
                        </Title>

                        {/* PWD and Date of Birth */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            {editingStudent ? (
                              <div>
                                <Text size="sm" weight={500} mb={5}>
                                  {STUDENT_FIELDS_CONFIG.pwd.label} (Read-only)
                                </Text>
                                <Text
                                  size="sm"
                                  p="xs"
                                  style={{
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    backgroundColor: "#f8f9fa",
                                    color: "#6c757d",
                                  }}
                                >
                                  {editingStudent.pwd ||
                                    editingStudent.PWD ||
                                    "Not specified"}
                                </Text>
                              </div>
                            ) : (
                              <Select
                                label={STUDENT_FIELDS_CONFIG.pwd.label}
                                placeholder={
                                  STUDENT_FIELDS_CONFIG.pwd.placeholder
                                }
                                value={manualFormData.pwd}
                                onChange={(value) =>
                                  setManualFormData({
                                    ...manualFormData,
                                    pwd: value,
                                  })
                                }
                                data={STUDENT_FIELDS_CONFIG.pwd.options}
                                required={STUDENT_FIELDS_CONFIG.pwd.required}
                                error={errors.pwd}
                              />
                            )}
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              type="date"
                              label={STUDENT_FIELDS_CONFIG.dob.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.dob.placeholder
                              }
                              value={manualFormData.dob || ""}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  dob: e.target.value,
                                })
                              }
                              required={STUDENT_FIELDS_CONFIG.dob.required}
                              error={errors.dob}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* JEE App No and Aadhar */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.jeeAppNo.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.jeeAppNo.placeholder
                              }
                              value={manualFormData.jeeAppNo}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  jeeAppNo: e.target.value,
                                })
                              }
                              required={STUDENT_FIELDS_CONFIG.jeeAppNo.required}
                              error={errors.jeeAppNo}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* Address */}
                        <Textarea
                          label={STUDENT_FIELDS_CONFIG.address.label}
                          placeholder={
                            STUDENT_FIELDS_CONFIG.address.placeholder
                          }
                          value={manualFormData.address}
                          onChange={(e) =>
                            setManualFormData({
                              ...manualFormData,
                              address: e.target.value,
                            })
                          }
                          required={STUDENT_FIELDS_CONFIG.address.required}
                          error={errors.address}
                          minRows={3}
                        />

                        {/* State */}
                        <TextInput
                          label={STUDENT_FIELDS_CONFIG.state.label}
                          placeholder={STUDENT_FIELDS_CONFIG.state.placeholder}
                          value={manualFormData.state}
                          onChange={(e) =>
                            setManualFormData({
                              ...manualFormData,
                              state: e.target.value,
                            })
                          }
                          required={STUDENT_FIELDS_CONFIG.state.required}
                          error={errors.state}
                        />

                        {/* Father's Details */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={
                                STUDENT_FIELDS_CONFIG.fatherOccupation.label
                              }
                              placeholder={
                                STUDENT_FIELDS_CONFIG.fatherOccupation
                                  .placeholder
                              }
                              value={manualFormData.fatherOccupation}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  fatherOccupation: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.fatherOccupation.required
                              }
                              error={errors.fatherOccupation}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.fatherMobile.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.fatherMobile.placeholder
                              }
                              value={manualFormData.fatherMobile}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  fatherMobile: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.fatherMobile.required
                              }
                              error={errors.fatherMobile}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* Mother's Details */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={
                                STUDENT_FIELDS_CONFIG.motherOccupation.label
                              }
                              placeholder={
                                STUDENT_FIELDS_CONFIG.motherOccupation
                                  .placeholder
                              }
                              value={manualFormData.motherOccupation}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  motherOccupation: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.motherOccupation.required
                              }
                              error={errors.motherOccupation}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.motherMobile.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.motherMobile.placeholder
                              }
                              value={manualFormData.motherMobile}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  motherMobile: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.motherMobile.required
                              }
                              error={errors.motherMobile}
                            />
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Stepper.Step>

                    <Stepper.Step
                      label="Academic Info"
                      description="Branch & marks details"
                      icon={<GraduationCap size={18} />}
                    >
                      <Stack spacing="md" mt="lg">
                        <Title order={3} size="h4" weight={700} mb="md">
                          Academic Info
                        </Title>

                        {/* Branch Selection */}
                        {editingStudent ? (
                          <div>
                            <Text size="sm" weight={500} mb={5}>
                              {STUDENT_FIELDS_CONFIG.branch.label} (Read-only)
                            </Text>
                            <Text
                              size="sm"
                              p="xs"
                              style={{
                                border: "1px solid #ced4da",
                                borderRadius: "4px",
                                backgroundColor: "#f8f9fa",
                                color: "#6c757d",
                              }}
                            >
                              {editingStudent.branch ||
                                editingStudent.Branch ||
                                editingStudent.discipline ||
                                editingStudent.Discipline ||
                                "Not specified"}
                            </Text>
                          </div>
                        ) : (
                          <Select
                            label={STUDENT_FIELDS_CONFIG.branch.label}
                            placeholder={
                              STUDENT_FIELDS_CONFIG.branch.placeholder
                            }
                            value={manualFormData.branch}
                            onChange={(value) =>
                              setManualFormData({
                                ...manualFormData,
                                branch: value,
                              })
                            }
                            data={
                              activeSection === "ug"
                                ? [
                                    {
                                      value:
                                        "Computer Science and Engineering (B.Tech)",
                                      label: "CSE",
                                    },
                                    {
                                      value:
                                        "Electronics and Communication Engineering (B.Tech)",
                                      label: "ECE",
                                    },
                                    {
                                      value: "Mechanical Engineering (B.Tech)",
                                      label: "ME",
                                    },
                                    {
                                      value: "Smart Manufacturing (B.Tech)",
                                      label: "SM",
                                    },
                                    {
                                      value: "Design (B.Des)",
                                      label: "Design",
                                    },
                                  ]
                                : activeSection === "pg"
                                  ? [
                                      {
                                        value:
                                          "Computer Science and Engineering (M.Tech)",
                                        label: "CSE",
                                      },
                                      {
                                        value:
                                          "Electronics and Communication Engineering (M.Tech)",
                                        label: "ECE",
                                      },
                                      {
                                        value:
                                          "Mechanical Engineering (M.Tech)",
                                        label: "ME",
                                      },
                                      {
                                        value: "Smart Manufacturing (M.Tech)",
                                        label: "SM",
                                      },
                                      {
                                        value: "Design (M.Des)",
                                        label: "Design",
                                      },
                                    ]
                                  : [
                                      {
                                        value:
                                          "Computer Science and Engineering (PhD)",
                                        label: "CSE",
                                      },
                                      {
                                        value:
                                          "Electronics and Communication Engineering (PhD)",
                                        label: "ECE",
                                      },
                                      {
                                        value: "Mechanical Engineering (PhD)",
                                        label: "ME",
                                      },
                                      {
                                        value: "Smart Manufacturing (PhD)",
                                        label: "SM",
                                      },
                                      {
                                        value: "Design (PhD)",
                                        label: "Design",
                                      },
                                    ]
                            }
                            required={STUDENT_FIELDS_CONFIG.branch.required}
                            error={errors.branch}
                          />
                        )}

                        {/* AI Rank and Category Rank */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              type="number"
                              label="AI Rank"
                              placeholder="Enter AI rank"
                              value={manualFormData.jeeRank}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  jeeRank: e.target.value,
                                })
                              }
                              required={STUDENT_FIELDS_CONFIG.jeeRank.required}
                              error={errors.jeeRank}
                              min={1}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              type="number"
                              label={STUDENT_FIELDS_CONFIG.categoryRank.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.categoryRank.placeholder
                              }
                              value={manualFormData.categoryRank}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  categoryRank: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.categoryRank.required
                              }
                              error={errors.categoryRank}
                              min={1}
                            />
                          </Grid.Col>
                        </Grid>

                        {/* Allotted Category and Gender */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            {editingStudent ? (
                              <div>
                                <Text size="sm" weight={500} mb={5}>
                                  {STUDENT_FIELDS_CONFIG.allottedCategory.label}{" "}
                                  (Read-only)
                                </Text>
                                <Text
                                  size="sm"
                                  p="xs"
                                  style={{
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    backgroundColor: "#f8f9fa",
                                    color: "#6c757d",
                                  }}
                                >
                                  {editingStudent.allottedCategory ||
                                    editingStudent.allottedcat ||
                                    editingStudent.allotted_category ||
                                    editingStudent["Allotted Cat"] ||
                                    "Not specified"}
                                </Text>
                              </div>
                            ) : (
                              <Select
                                label={
                                  STUDENT_FIELDS_CONFIG.allottedCategory.label
                                }
                                placeholder={
                                  STUDENT_FIELDS_CONFIG.allottedCategory
                                    .placeholder
                                }
                                value={manualFormData.allottedCategory}
                                onChange={(value) =>
                                  setManualFormData({
                                    ...manualFormData,
                                    allottedCategory: value,
                                  })
                                }
                                data={
                                  STUDENT_FIELDS_CONFIG.allottedCategory.options
                                }
                                required={
                                  STUDENT_FIELDS_CONFIG.allottedCategory
                                    .required
                                }
                                error={errors.allottedCategory}
                              />
                            )}
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            {editingStudent ? (
                              <div>
                                <Text size="sm" weight={500} mb={5}>
                                  {STUDENT_FIELDS_CONFIG.allottedGender.label}{" "}
                                  (Read-only)
                                </Text>
                                <Text
                                  size="sm"
                                  p="xs"
                                  style={{
                                    border: "1px solid #ced4da",
                                    borderRadius: "4px",
                                    backgroundColor: "#f8f9fa",
                                    color: "#6c757d",
                                  }}
                                >
                                  {editingStudent.allottedGender ||
                                    editingStudent.allotted_gender ||
                                    editingStudent["Allotted Gender"] ||
                                    "Not specified"}
                                </Text>
                              </div>
                            ) : (
                              <Select
                                label={
                                  STUDENT_FIELDS_CONFIG.allottedGender.label
                                }
                                placeholder={
                                  STUDENT_FIELDS_CONFIG.allottedGender
                                    .placeholder
                                }
                                value={manualFormData.allottedGender}
                                onChange={(value) =>
                                  setManualFormData({
                                    ...manualFormData,
                                    allottedGender: value,
                                  })
                                }
                                data={
                                  STUDENT_FIELDS_CONFIG.allottedGender.options
                                }
                                required={
                                  STUDENT_FIELDS_CONFIG.allottedGender.required
                                }
                                error={errors.allottedGender}
                              />
                            )}
                          </Grid.Col>
                        </Grid>

                        {/* Institute Details */}
                        <Grid>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.rollNumber.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.rollNumber.placeholder
                              }
                              value={manualFormData.rollNumber}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  rollNumber: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.rollNumber.required
                              }
                              error={errors.rollNumber}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <TextInput
                              type="email"
                              label={STUDENT_FIELDS_CONFIG.instituteEmail.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.instituteEmail.placeholder
                              }
                              value={manualFormData.instituteEmail}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  instituteEmail: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.instituteEmail.required
                              }
                              error={errors.instituteEmail}
                            />
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Stepper.Step>

                    <Stepper.Step
                      label="Review & Submit"
                      description="Verify details"
                      icon={<Check size={18} />}
                    >
                      <Stack spacing="md" mt="lg">
                        <Title order={3} size="h4" weight={700} mb="md">
                          Review & Submit
                        </Title>

                        <div
                          style={{
                            backgroundColor: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "8px",
                          }}
                        >
                          <Text weight={600} mb="xs">
                            Basic Information
                          </Text>
                          <Text size="sm">
                            <strong>Name:</strong> {manualFormData.name}
                          </Text>
                          <Text size="sm">
                            <strong>Father Name:</strong> {manualFormData.fname}
                          </Text>
                          <Text size="sm">
                            <strong>Mother Name:</strong> {manualFormData.mname}
                          </Text>
                          <Text size="sm">
                            <strong>Gender:</strong> {manualFormData.gender}
                          </Text>
                          <Text size="sm">
                            <strong>Category:</strong> {manualFormData.category}
                          </Text>
                          {manualFormData.phoneNumber && (
                            <Text size="sm">
                              <strong>Phone Number:</strong>{" "}
                              {manualFormData.phoneNumber}
                            </Text>
                          )}
                          {manualFormData.email && (
                            <Text size="sm">
                              <strong>Personal Email:</strong>{" "}
                              {manualFormData.email}
                            </Text>
                          )}
                        </div>

                        <div
                          style={{
                            backgroundColor: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "8px",
                          }}
                        >
                          <Text weight={600} mb="xs">
                            Additional Information
                          </Text>
                          <Text size="sm">
                            <strong>PWD:</strong> {manualFormData.pwd}
                          </Text>
                          {manualFormData.dob && (
                            <Text size="sm">
                              <strong>Date of Birth:</strong>{" "}
                              {manualFormData.dob}
                            </Text>
                          )}
                          <Text size="sm">
                            <strong>JEE App. No.:</strong>{" "}
                            {manualFormData.jeeAppNo}
                          </Text>
                          <Text size="sm">
                            <strong>Address:</strong> {manualFormData.address}
                          </Text>
                          {manualFormData.fatherOccupation && (
                            <Text size="sm">
                              <strong>Father's Occupation:</strong>{" "}
                              {manualFormData.fatherOccupation}
                            </Text>
                          )}
                          {manualFormData.fatherMobile && (
                            <Text size="sm">
                              <strong>Father's Mobile:</strong>{" "}
                              {manualFormData.fatherMobile}
                            </Text>
                          )}
                          {manualFormData.motherOccupation && (
                            <Text size="sm">
                              <strong>Mother's Occupation:</strong>{" "}
                              {manualFormData.motherOccupation}
                            </Text>
                          )}
                          {manualFormData.motherMobile && (
                            <Text size="sm">
                              <strong>Mother's Mobile:</strong>{" "}
                              {manualFormData.motherMobile}
                            </Text>
                          )}
                          {manualFormData.state && (
                            <Text size="sm">
                              <strong>State:</strong> {manualFormData.state}
                            </Text>
                          )}
                        </div>

                        <div
                          style={{
                            backgroundColor: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "8px",
                          }}
                        >
                          <Text weight={600} mb="xs">
                            Academic Information
                          </Text>
                          <Text size="sm">
                            <strong>Branch:</strong> {manualFormData.branch}
                          </Text>
                          {manualFormData.jeeRank && (
                            <Text size="sm">
                              <strong>AI Rank:</strong> {manualFormData.jeeRank}
                            </Text>
                          )}
                          {manualFormData.categoryRank && (
                            <Text size="sm">
                              <strong>Category Rank:</strong>{" "}
                              {manualFormData.categoryRank}
                            </Text>
                          )}
                          {manualFormData.allottedCategory && (
                            <Text size="sm">
                              <strong>Allotted Category:</strong>{" "}
                              {manualFormData.allottedCategory}
                            </Text>
                          )}
                          {manualFormData.allottedGender && (
                            <Text size="sm">
                              <strong>Allotted Gender:</strong>{" "}
                              {manualFormData.allottedGender}
                            </Text>
                          )}
                          {manualFormData.rollNumber && (
                            <Text size="sm">
                              <strong>Institute Roll Number:</strong>{" "}
                              {manualFormData.rollNumber}
                            </Text>
                          )}
                          {manualFormData.instituteEmail && (
                            <Text size="sm">
                              <strong>Institute Email ID:</strong>{" "}
                              {manualFormData.instituteEmail}
                            </Text>
                          )}
                        </div>
                      </Stack>
                    </Stepper.Step>
                  </Stepper>

                  <Group position="apart" mt="xl">
                    <Button
                      variant="default"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                    >
                      <CaretLeft size={16} style={{ marginRight: "8px" }} />
                      Previous
                    </Button>
                    <Button
                      onClick={nextStep}
                      style={{ backgroundColor: "#3498db" }}
                    >
                      {currentStep === 3
                        ? editingStudent
                          ? "Update"
                          : "Submit"
                        : "Next"}
                      {currentStep === 3 ? (
                        <Check size={16} style={{ marginLeft: "8px" }} />
                      ) : (
                        <CaretRight size={16} style={{ marginLeft: "8px" }} />
                      )}
                    </Button>
                  </Group>
                </Card>
              </Stack>
            </Container>
          )}
        </Modal>

        {/* Student List Modal */}
        <Modal
          opened={showStudentModal}
          onClose={() => {
            setShowStudentModal(false);
            setSelectedBatch(null);
            setStudentList([]);
            setStudentSearchQuery("");
            setShowExportModal(false);
          }}
          title={
            <Text size="lg" weight={600} color="#3498db">
              📋 Students in {selectedBatch?.displayBranch || "Branch"} -{" "}
              {selectedBatch?.programme} ({getCurrentAcademicYear()})
            </Text>
          }
          size="90vw"
          centered
          padding="md"
          styles={{
            modal: {
              maxWidth: "95vw",
              maxHeight: "90vh",
            },
            body: {
              padding: "20px",
              maxHeight: "75vh",
              overflow: "auto",
            },
          }}
        >
          <Stack spacing="md">
            {selectedBatch && (
              <Card
                withBorder
                padding="md"
                style={{ backgroundColor: "#f8f9fa" }}
              >
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm">
                      <strong>Programme:</strong> {selectedBatch.programme}
                    </Text>
                    <Text size="sm">
                      <strong>Branch:</strong> {selectedBatch.displayBranch}
                    </Text>
                    <Text size="sm">
                      <strong>Academic Year:</strong> {getCurrentAcademicYear()}
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm">
                      <strong>Total Seats:</strong> {selectedBatch.totalSeats}
                    </Text>
                    <Text size="sm">
                      <strong>Filled Seats:</strong> {selectedBatch.filledSeats}
                    </Text>
                    <Text size="sm">
                      <strong>Available Seats:</strong>{" "}
                      {selectedBatch.availableSeats}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Card>
            )}

            {/* Search and Export Controls */}
            <Box
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                padding: "20px",
                border: "1px solid #e2e8f0",
              }}
            >
              <Group justify="space-between" align="center">
                <TextInput
                  placeholder="Search"
                  value={studentSearchQuery}
                  onChange={(event) =>
                    setStudentSearchQuery(event.currentTarget.value)
                  }
                  leftSection={<MagnifyingGlass size={18} color="#6b7280" />}
                  size="md"
                  radius="md"
                  style={{
                    flex: 1,
                    maxWidth: "450px",
                    fontSize: "14px",
                  }}
                  styles={{
                    input: {
                      border: "1px solid #d1d5db",
                      backgroundColor: "#ffffff",
                      "&:focus": {
                        borderColor: "#3b82f6",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    },
                  }}
                />
                <Group spacing="md">
                  <Text
                    size="sm"
                    color="#6b7280"
                    weight={500}
                    style={{ minWidth: "120px" }}
                  >
                    Showing {getFilteredStudents().length} of{" "}
                    {studentList.length} students
                  </Text>
                  <Button
                    leftSection={<Download size={18} />}
                    onClick={() => setShowExportModal(true)}
                    disabled={studentList.length === 0}
                    variant="filled"
                    color="blue"
                    size="md"
                    radius="md"
                    style={{
                      fontWeight: 500,
                      backgroundColor: "#2563eb",
                      minWidth: "140px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Export Data
                  </Button>
                </Group>
              </Group>
            </Box>

            {studentList.length > 0 ? (
              <div
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                <ScrollArea style={{ height: "70vh", width: "100%" }}>
                  <Table
                    striped
                    highlightOnHover
                    style={{
                      minWidth: "2000px",
                      fontSize: "13px",
                      tableLayout: "fixed",
                    }}
                  >
                    <thead style={{ position: "sticky", top: 0, zIndex: 15 }}>
                      <tr
                        style={{
                          backgroundColor: "#f8fafc",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "60px",
                            position: "sticky",
                            left: 0,
                            backgroundColor: "#f8fafc",
                            zIndex: 20,
                            borderRight: "2px solid #e2e8f0",
                            fontWeight: "bold",
                            fontSize: "13px",
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          S.No
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "160px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          JEE Application
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "140px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Roll Number
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "180px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Name
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "120px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Discipline
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "80px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Gender
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "90px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Category
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "60px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          PwD
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "120px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Mobile
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "200px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Institute Email
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "180px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Alternate Email
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "150px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Father's Name
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "140px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Father's Job
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "120px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Father Mobile
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "150px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Mother's Name
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "140px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Mother's Job
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "120px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Mother Mobile
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "100px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          DOB
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "80px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          AI Rank
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "100px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Category Rank
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "100px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Allotted Cat
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "100px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Allotted Gender
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "80px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          State
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "250px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Address
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "130px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: "16px 12px",
                            textAlign: "center",
                            color: "#1e293b",
                            width: "150px",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStudents().map((student, index) => (
                        <tr
                          key={student.id || student.student_id || index}
                          style={{
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f8fafc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              position: "sticky",
                              left: 0,
                              backgroundColor: "#ffffff",
                              zIndex: 10,
                              fontWeight: "bold",
                              borderRight: "2px solid #e5e7eb",
                              fontSize: "13px",
                              color: "#1f2937",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                              wordBreak: "break-all",
                              whiteSpace: "normal",
                            }}
                          >
                            {student["Jee Main Application Number"] ||
                              student.jeeAppNo ||
                              student.jee_app_no ||
                              student["JEE Main Application Number"] ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Badge color="blue" variant="light" size="sm">
                              {student["Institute Roll Number"] ||
                                student.rollNumber ||
                                student.roll_number ||
                                "-"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "left",
                              fontSize: "13px",
                              fontWeight: "500",
                              color: "#111827",
                            }}
                          >
                            {student.Name || student.name || "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student.Discipline ||
                              student.discipline ||
                              student.branch ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Badge variant="outline" size="sm" color="gray">
                              {student.Gender || student.gender || "-"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Badge variant="outline" size="sm" color="indigo">
                              {student.Category || student.category || "-"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Badge
                              color={
                                (
                                  student.PwD ||
                                  student.pwd ||
                                  student.PWD ||
                                  "NO"
                                ).toUpperCase() === "YES"
                                  ? "orange"
                                  : "green"
                              }
                              variant="filled"
                              size="sm"
                            >
                              {(
                                student.PwD ||
                                student.pwd ||
                                student.PWD ||
                                "NO"
                              ).toUpperCase()}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student.MobileNo ||
                              student.phoneNumber ||
                              student.phone_number ||
                              student.mobile ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "left",
                              fontSize: "11px",
                              color: "#6b7280",
                            }}
                          >
                            {student["Institute Email ID"] ||
                              student.instituteEmail ||
                              student.institute_email ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "left",
                              fontSize: "11px",
                              color: "#6b7280",
                            }}
                          >
                            {student["Alternet Email ID"] ||
                              student.email ||
                              student.personal_email ||
                              student["Alternate Email ID"] ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "left",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Father's Name"] ||
                              student.fname ||
                              student.father_name ||
                              student.fatherName ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Father's Occupation"] ||
                              student.fatherOccupation ||
                              student.father_occupation ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Father Mobile Number"] ||
                              student.fatherMobile ||
                              student.father_mobile ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "left",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Mother's Name"] ||
                              student.mname ||
                              student.mother_name ||
                              student.motherName ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Mother's Occupation"] ||
                              student.motherOccupation ||
                              student.mother_occupation ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Mother Mobile Number"] ||
                              student.motherMobile ||
                              student.mother_mobile ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Date of Birth"] ||
                              student.dob ||
                              student.date_of_birth ||
                              student.DOB ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#1f2937",
                            }}
                          >
                            <Badge variant="filled" color="yellow" size="sm">
                              {student["AI rank"] ||
                                student.aiRank ||
                                student.ai_rank ||
                                student["AI Rank"] ||
                                "-"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student["Category Rank"] ||
                              student.categoryRank ||
                              student.category_rank ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Badge variant="outline" size="sm" color="purple">
                              {student.allottedcat ||
                                student.allottedCategory ||
                                student.allotted_category ||
                                student["Allotted Cat"] ||
                                "-"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Badge variant="outline" size="sm" color="pink">
                              {student["Allotted Gender"] ||
                                student.allottedGender ||
                                student.allotted_gender ||
                                "-"}
                            </Badge>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#374151",
                            }}
                          >
                            {student.State || student.state || "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "left",
                              fontSize: "11px",
                              color: "#6b7280",
                            }}
                          >
                            {student["Full Address"] ||
                              student.address ||
                              student.Address ||
                              "-"}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Button
                              size="xs"
                              variant={
                                student.reportedStatus === "REPORTED"
                                  ? "filled"
                                  : "outline"
                              }
                              color={
                                student.reportedStatus === "REPORTED"
                                  ? "green"
                                  : "orange"
                              }
                              loading={updatingReportStatus === student.id}
                              onClick={() =>
                                handleReportedStatusToggle(
                                  student.id,
                                  student.reportedStatus,
                                )
                              }
                              style={{
                                minWidth: "110px",
                                fontSize: "11px",
                                fontWeight: "500",
                              }}
                            >
                              {student.reportedStatus === "REPORTED"
                                ? "✓ Reported"
                                : "○ Not Reported"}
                            </Button>
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "center",
                              fontSize: "12px",
                            }}
                          >
                            <Flex gap="8px" justify="center">
                              <ActionIcon
                                size="sm"
                                variant="outline"
                                color="blue"
                                loading={
                                  editingStudent ===
                                  (student.id || student.student_id)
                                }
                                onClick={() => handleEditStudent(student)}
                                style={{
                                  borderRadius: "6px",
                                }}
                              >
                                <PencilSimple size={14} />
                              </ActionIcon>
                              <ActionIcon
                                size="sm"
                                variant="outline"
                                color="red"
                                loading={
                                  deletingStudent ===
                                  (student.id || student.student_id)
                                }
                                onClick={() => handleDeleteStudent(student)}
                                style={{
                                  borderRadius: "6px",
                                }}
                              >
                                <X size={14} />
                              </ActionIcon>
                            </Flex>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <Paper
                padding="xl"
                style={{ textAlign: "center", backgroundColor: "#f8f9fa" }}
              >
                <Text size="lg" color="dimmed">
                  No students found in this batch
                </Text>
                <Text size="sm" color="dimmed" mt="xs">
                  Students will appear here after they are uploaded and
                  allocated roll numbers
                </Text>
              </Paper>
            )}

            {/* TODO: Backend Implementation Notes for Student List Modal
                1. API: GET /programme_curriculum/api/students/{batch_id}/
                   - Fetch all students for a specific batch
                   - Include pagination for large batches
                   - Response: { success: true, students: [...], total: number }
                
                2. API: PUT /programme_curriculum/api/update-student-status/
                   - Update student reported status
                   - Body: { studentId, reportedStatus }
                   - Log changes with admin user and timestamp
                   - Response: { success: true, message: "Status updated" }
                
                3. CRUD Operations APIs:
                   - GET /programme_curriculum/api/student/{student_id}/
                     Response: { success: true, student: {...} }
                   
                   - PUT /programme_curriculum/api/student/{student_id}/
                     Body: { all student fields as per STUDENT_FIELDS_CONFIG }
                     Response: { success: true, message: "Student updated", student: {...} }
                   
                   - DELETE /programme_curriculum/api/student/{student_id}/
                     Response: { success: true, message: "Student deleted" }
                     Should also update batch student count and related data
                
                4. Additional features to implement in backend:
                   - Export student list for specific batch
                   - Send bulk notifications to students
                   - Generate attendance reports
                   - Filter students by reported status
                   - Audit logging for all CRUD operations with user and timestamp
            */}
          </Stack>
        </Modal>

        {/* Add New Batch Modal */}
        <Modal
          opened={showAddBatchModal}
          onClose={() => setShowAddBatchModal(false)}
          title="Add New Batch"
          size="md"
          centered
        >
          <Stack spacing="md">
            <Select
              label="Programme"
              placeholder="Select programme"
              value={newBatchData.programme}
              onChange={(value) =>
                setNewBatchData({ ...newBatchData, programme: value })
              }
              data={getProgrammeOptions()}
              required
            />

            <Select
              label="Discipline"
              placeholder="Select discipline"
              value={newBatchData.discipline}
              onChange={(value) =>
                setNewBatchData({ ...newBatchData, discipline: value })
              }
              data={getDisciplineOptions(newBatchData.programme)}
              disabled={!newBatchData.programme}
              required
            />

            <TextInput
              label="Academic Year"
              placeholder="Enter year"
              value={newBatchData.year}
              onChange={(event) =>
                setNewBatchData({
                  ...newBatchData,
                  year: event.currentTarget.value,
                })
              }
              type="number"
              min="2020"
              max="2030"
              required
            />

            <TextInput
              label="Total Seats"
              placeholder="Enter total seats"
              value={newBatchData.totalSeats}
              onChange={(event) =>
                setNewBatchData({
                  ...newBatchData,
                  totalSeats: event.currentTarget.value,
                })
              }
              type="number"
              min="1"
              max="500"
              required
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => setShowAddBatchModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBatch}
                disabled={
                  !newBatchData.programme ||
                  !newBatchData.discipline ||
                  !newBatchData.totalSeats
                }
              >
                Add Batch
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
          size="sm"
          centered
        >
          <Stack spacing="md">
            <Text>
              Are you sure you want to delete this batch? This action cannot be
              undone.
            </Text>
            <Text size="sm" color="dimmed">
              Note: You can only delete batches with no enrolled students.
            </Text>

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button color="red" onClick={handleDeleteBatch}>
                Delete Batch
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Delete Student Confirmation Modal */}
        <Modal
          opened={showDeleteStudentConfirm}
          onClose={() => setShowDeleteStudentConfirm(false)}
          title="Confirm Delete Student"
          size="lg"
          centered
        >
          <Stack spacing="md">
            <Text>
              Are you sure you want to delete student{" "}
              <strong>"{studentToDelete?.name}"</strong>?
            </Text>
            <Text size="sm" color="dimmed">
              This action cannot be undone.
            </Text>
            <Text size="sm" color="orange">
              Note: If this student has associated records in other modules,
              deletion may not be possible due to database constraints.
            </Text>

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => setShowDeleteStudentConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                color="red"
                loading={deletingStudent === studentToDelete?.id}
                onClick={confirmDeleteStudent}
              >
                Delete Student
              </Button>
            </Group>
          </Stack>
        </Modal>

        {
          /* Export Modal */
          <Modal
            opened={showExportModal}
            onClose={() => setShowExportModal(false)}
            title={
              <Group spacing="sm" align="center">
                <Download size={18} color="#2563eb" />
                <Text size="md" weight={600} color="#1f2937">
                  Export Student Data
                </Text>
              </Group>
            }
            size="lg"
            centered
            padding="lg"
            styles={{
              modal: {
                backgroundColor: "#ffffff",
                borderRadius: "8px",
              },
              header: {
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                padding: "16px 20px",
              },
              body: {
                padding: "20px",
              },
            }}
          >
            <Stack spacing="md">
              <Text size="sm" color="#6b7280">
                Select export format and fields for data analysis.
              </Text>

              {/* Export Format Selection */}
              <Group spacing="sm">
                <Button
                  variant={exportFormat === "excel" ? "filled" : "light"}
                  color={exportFormat === "excel" ? "teal" : "gray"}
                  onClick={() => setExportFormat("excel")}
                  leftSection={<FileXls size={16} />}
                  size="sm"
                  radius="md"
                >
                  Excel
                </Button>
                <Button
                  variant={exportFormat === "csv" ? "filled" : "light"}
                  color={exportFormat === "csv" ? "blue" : "gray"}
                  onClick={() => setExportFormat("csv")}
                  leftSection={<Download size={16} />}
                  size="sm"
                  radius="md"
                >
                  CSV
                </Button>
              </Group>

              {/* Field Selection */}
              <Stack spacing="sm">
                <Group justify="space-between" align="center">
                  <Text weight={500} size="sm" color="#374151">
                    Select Fields
                  </Text>
                  <Switch
                    label="Select All"
                    checked={selectAllFields}
                    onChange={handleToggleAllFields}
                    size="sm"
                    color="blue"
                    styles={{
                      label: {
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#374151",
                      },
                    }}
                  />
                </Group>

                <Box
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "12px",
                  }}
                >
                  <Grid gutter="xs">
                    {getExportableFields().map((field) => (
                      <Grid.Col span={6} key={field.key}>
                        <Switch
                          label={field.label}
                          checked={selectedFields[field.key] || false}
                          onChange={(event) =>
                            handleFieldChange(
                              field.key,
                              event.currentTarget.checked,
                            )
                          }
                          size="xs"
                          color="blue"
                          styles={{
                            label: {
                              fontSize: "12px",
                              fontWeight: 400,
                            },
                          }}
                        />
                      </Grid.Col>
                    ))}
                  </Grid>
                </Box>
              </Stack>

              {/* Export Summary & Actions */}
              <Group
                justify="space-between"
                align="center"
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Group spacing="lg">
                  <Text size="xs" color="#6b7280">
                    <Text component="span" weight={600} color="#1e40af">
                      {getFilteredStudents().length}
                    </Text>{" "}
                    records
                  </Text>
                  <Text size="xs" color="#6b7280">
                    <Text component="span" weight={600} color="#1e40af">
                      {Object.values(selectedFields).filter(Boolean).length}
                    </Text>{" "}
                    fields
                  </Text>
                  <Text size="xs" color="#6b7280">
                    Format:{" "}
                    <Text
                      component="span"
                      weight={600}
                      color="#1e40af"
                      style={{ textTransform: "uppercase" }}
                    >
                      {exportFormat}
                    </Text>
                  </Text>
                </Group>
                <Group spacing="sm">
                  <Button
                    variant="outline"
                    color="gray"
                    onClick={() => setShowExportModal(false)}
                    disabled={isExporting}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    leftSection={<Download size={16} />}
                    onClick={handleStudentExport}
                    loading={isExporting}
                    disabled={
                      Object.values(selectedFields).filter(Boolean).length === 0
                    }
                    size="sm"
                    color="blue"
                  >
                    {isExporting ? "Exporting..." : "Export"}
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Modal>
        }
      </Container>
    </>
  );
};

export default AdminUpcomingBatch;

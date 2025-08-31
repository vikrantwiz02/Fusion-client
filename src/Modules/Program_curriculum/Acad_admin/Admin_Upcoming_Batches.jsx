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
  Checkbox,
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
  Trash,
} from "@phosphor-icons/react";
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
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
import axios from "axios";
import { host } from "../../../routes/globalRoutes";

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

const PROGRAMME_TYPES = {
  UG: "ug",
  PG: "pg",
  PHD: "phd",
};

const STUDENT_FIELDS_CONFIG = {
  jeeAppNo: {
    label: "JEE App. No.",
    placeholder: "Enter JEE application number",
    required: true,
    backendField: "jee_app_no",
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
    backendField: "name", 
    excelColumns: ["name", "student name", "full name"],
  },
  fname: {
    label: "Father Name",
    placeholder: "Enter father's name",
    required: true,
    backendField: "father_name",
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
    backendField: "mother_name",
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

  gender: {
    label: "Gender",
    placeholder: "Select gender",
    required: true,
    type: "select",
    backendField: "gender", 
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
    backendField: "category",
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
    backendField: "allotted_gender",
    options: [
      { value: "Gender-Neutral", label: "Gender-Neutral" },
      { value: "Female Only", label: "Female Only" },
    ],
    excelColumns: ["allotted gender"],
  },
  allottedCategory: {
    label: "Allotted Category",
    placeholder: "Enter allotted category",
    required: false,
    type: "text",
    backendField: "allotted_category",
    excelColumns: ["allottedcat", "allotted category"],
  },
  pwd: {
    label: "PWD (Person with Disability)",
    placeholder: "Select PWD status",
    required: true,
    type: "select",
    backendField: "pwd",
    options: [
      { value: "YES", label: "Yes" },
      { value: "NO", label: "No" },
    ],
    excelColumns: ["pwd", "disability", "person with disability"],
  },

  branch: {
    label: "Branch",
    placeholder: "Select branch",
    required: true,
    type: "select",
    backendField: "branch",
    options: [
      { value: "Computer Science and Engineering", label: "Computer Science and Engineering" },
      { value: "Electronics and Communication Engineering", label: "Electronics and Communication Engineering" },
      { value: "Mechanical Engineering", label: "Mechanical Engineering" },
      { value: "Smart Manufacturing", label: "Smart Manufacturing" },
      { value: "Design", label: "Design" },
    ],
    excelColumns: [
      "discipline",
      "branch",
      "brtd",
      "brnm",
      "brcd",
      "department",
    ],
  },

  address: {
    label: "Address",
    placeholder: "Enter complete address",
    required: true,
    type: "textarea",
    backendField: "address",
    excelColumns: [
      "full address",
      "address",
      "permanent address",
      "home address",
    ],
  },

  phoneNumber: {
    label: "Phone Number",
    placeholder: "Enter phone number",
    required: false,
    backendField: "phone_number",
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
    backendField: "personal_email",
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
    backendField: "date_of_birth",
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
    backendField: "ai_rank",
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
    backendField: "category_rank",
    excelColumns: ["category rank", "cat rank"],
  },

  fatherOccupation: {
    label: "Father's Occupation",
    placeholder: "Enter father's occupation",
    required: false,
    backendField: "father_occupation", 
    excelColumns: ["father's occupation", "father occupation"],
  },
  fatherMobile: {
    label: "Father's Mobile",
    placeholder: "Enter father's mobile number",
    required: false,
    backendField: "father_mobile", 
    excelColumns: ["father mobile number", "father mobile", "father phone"],
  },
  motherOccupation: {
    label: "Mother's Occupation",
    placeholder: "Enter mother's occupation",
    required: false,
    backendField: "mother_occupation", 
    excelColumns: ["mother's occupation", "mother occupation"],
  },
  motherMobile: {
    label: "Mother's Mobile",
    placeholder: "Enter mother's mobile number",
    required: false,
    backendField: "mother_mobile", 
    excelColumns: ["mother mobile number", "mother mobile", "mother phone"],
  },
  state: {
    label: "State",
    placeholder: "Enter state",
    required: false,
    backendField: "state", 
    excelColumns: ["state", "state name"],
  },
  rollNumber: {
    label: "Institute Roll Number",
    placeholder: "Enter institute roll number",
    required: false,
    backendField: "roll_number", 
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
    backendField: "institute_email", 
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
  jeeAppNo: "",
  name: "",
  fname: "",
  mname: "",
  gender: "",
  category: "",
  pwd: "NO",
  branch: "",
  address: "",

  phoneNumber: "",
  email: "",
  dob: "",
  jeeRank: "",
  categoryRank: "",

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
  const getCurrentBatchYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();

    if (month >= 6) {
      // July to December
      return currentYear;
    } else {
      // January to June
      return currentYear - 1;
    }
  };

  // Automatically adds new years in July, separate for UG/PG/PHD
  const getBatchYearOptions = (programmeType) => {
    const currentBatchYear = getCurrentBatchYear();
    const options = [];
    const baseStartYear = 2016;
    let startYear, endYear;
    
    switch (programmeType) {
      case PROGRAMME_TYPES.UG:
        startYear = Math.max(baseStartYear, currentBatchYear - 3);
        endYear = currentBatchYear;
        break;
      case PROGRAMME_TYPES.PG:
        startYear = Math.max(baseStartYear, currentBatchYear - 1);
        endYear = currentBatchYear;
        break;
      case PROGRAMME_TYPES.PHD:
        startYear = Math.max(baseStartYear, currentBatchYear - 5);
        endYear = currentBatchYear;
        break;
      default:
        startYear = baseStartYear;
        endYear = currentBatchYear;
    }

    for (let year = endYear; year >= startYear; year--) {
      const academicYear = batchYearToAcademicYear(year);
      options.push({
        value: year.toString(),
        label: `${year} (Academic Year: ${academicYear})`
      });
    }
    
    return options;
  };

  // Function to generate academic year options for viewing data
  const getViewAcademicYearOptions = () => {
    const currentBatchYear = getCurrentBatchYear();
    const options = [];

    for (let year = currentBatchYear; year >= currentBatchYear - 5; year--) {
      const academicYear = batchYearToAcademicYear(year);
      options.push({
        value: year.toString(),
        label: academicYear
      });
    }
    
    return options;
  };

  const isViewingCurrentYear = () => {
    const currentYear = getCurrentBatchYear();
    return viewAcademicYear === currentYear;
  };

  const batchYearToAcademicYear = (batchYear) => {
    const year = parseInt(batchYear, 10);
    return `${year}-${(year + 1).toString().slice(-2)}`;
  };

  const academicYearToBatchYear = (academicYear) => {
    if (typeof academicYear === 'number') return academicYear;
    if (typeof academicYear === 'string' && academicYear.includes('-')) {
      return parseInt(academicYear.split('-')[0], 10);
    }
    return parseInt(academicYear, 10);
  };

  const getCurrentAcademicYearString = () => {
    return batchYearToAcademicYear(getCurrentBatchYear());
  };

  const normalizeBatchData = (batchData) => {
    return batchData.map(batch => {
      const totalSeats = batch.totalSeats || batch.total_seats || 0;
      const filledSeats = batch.filledSeats || batch.filled_seats || batch.student_count || 0;
      const availableSeats = Math.max(0, totalSeats - filledSeats);
      
      return {
        ...batch,
        year: academicYearToBatchYear(batch.year), 
        totalSeats,
        filledSeats,
        availableSeats,
        name: batch.name || batch.programme || "Unknown",
      };
    });
  };

  const showWorkflowGuidance = (errorType, details = {}) => {
    switch (errorType) {
      case 'curriculum_required':
        notifications.show({
          title: "🎯 Setup Required: Step 1 of 3",
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>Create a curriculum first:</strong>
              </Text>
              <Text size="xs" color="gray.7">
                1. Go to Programme Curriculum → Admin Curriculum<br/>
                2. Click "Add Curriculum" to create a new curriculum<br/>
                3. Set status to "Working" when ready<br/>
                4. Then come back to create batches
              </Text>
            </div>
          ),
          color: "blue",
          autoClose: 12000,
          style: {
            backgroundColor: '#e3f2fd',
            borderColor: '#90caf9',
            color: '#1565c0',
          },
        });
        break;
        
      case 'batches_required':
        notifications.show({
          title: "🎯 Setup Required: Step 2 of 3", 
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>Create batches for {details.academicYear || 'current year'}:</strong>
              </Text>
              <Text size="xs" color="gray.7">
                1. Curriculum ✅ (completed)<br/>
                2. Create batches and assign curriculum to each<br/>
                3. Then upload student data
              </Text>
            </div>
          ),
          color: "blue",
          autoClose: 10000,
          style: {
            backgroundColor: '#e3f2fd',
            borderColor: '#90caf9',
            color: '#1565c0',
          },
        });
        break;
        
      case 'curriculum_assignment_required':
        notifications.show({
          title: "🎯 Setup Required: Step 2b of 3",
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>Assign curriculum to batches:</strong>
              </Text>
              <Text size="xs" color="gray.7">
                1. Curriculum ✅ (completed)<br/>
                2. Batches ✅ (completed)<br/>
                3. Assign curriculum to: {details.batchNames}<br/>
                4. Then upload student data
              </Text>
            </div>
          ),
          color: "orange",
          autoClose: 12000,
          style: {
            backgroundColor: '#fff3cd',
            borderColor: '#ffeaa7',
            color: '#856404',
          },
        });
        break;
        
      case 'ready_for_students':
        notifications.show({
          title: "🎉 Ready for Step 3!",
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>All prerequisites completed:</strong>
              </Text>
              <Text size="xs" color="gray.7">
                1. Curriculum ✅<br/>
                2. Batches ✅<br/>
                3. Curriculum Assignment ✅<br/>
                You can now upload student data!
              </Text>
            </div>
          ),
          color: "green",
          autoClose: 8000,
          style: {
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb',
            color: '#155724',
          },
        });
        break;
    }
  };

  // Proactive validation check before attempting student operations
  const checkPrerequisites = async () => {
    try {
      const currentBatches = getCurrentYearBatches();
      
      if (!currentBatches || currentBatches.length === 0) {
        showWorkflowGuidance('batches_required', { 
          academicYear: getCurrentAcademicYearString()
        });
        return false;
      }

      const batchesWithoutCurriculum = currentBatches.filter(batch => 
        !batch.curriculum || !batch.curriculum_id
      );
      
      if (batchesWithoutCurriculum.length > 0) {
        const batchNames = batchesWithoutCurriculum
          .map(batch => `${batch.name} ${batch.discipline}`)
          .join(', ');
        showWorkflowGuidance('curriculum_assignment_required', { batchNames });
        return false;
      }

      showWorkflowGuidance('ready_for_students');
      return true;
      
    } catch (error) {
      console.error('Prerequisites check failed:', error);
      return true;
    }
  };

  // Helper to get current year batches based on active section
  const getCurrentYearBatches = () => {
    const currentYear = getCurrentBatchYear();
    switch (activeSection) {
      case 'ug':
        return ugBatches.filter(batch => batch.year === currentYear);
      case 'pg':
        return pgBatches.filter(batch => batch.year === currentYear);
      case 'phd':
        return phdBatches.filter(batch => batch.year === currentYear);
      default:
        return [];
    }
  };

  // Helper function to determine target batch based on branch
  const getBatchForBranch = (branch, batches) => {
    if (!branch || !batches || batches.length === 0) return null;

    const normalizedBranch = branch.toLowerCase().trim();

    const branchMappings = {
      'computer science': 'CSE',
      'computer science and engineering': 'CSE',
      'cse': 'CSE',
      'cs': 'CSE',
      'computer science (b.tech)': 'CSE',
      'computer science and engineering (b.tech)': 'CSE',
      'computer science (m.tech)': 'CSE',
      'computer science and engineering (m.tech)': 'CSE',
      'computer science (phd)': 'CSE',
      'computer science and engineering (phd)': 'CSE',

      'electronics': 'ECE',
      'electronics and communication': 'ECE',
      'electronics and communication engineering': 'ECE',
      'ece': 'ECE',
      'ec': 'ECE',
      'electronics (b.tech)': 'ECE',
      'electronics and communication engineering (b.tech)': 'ECE',
      'electronics (m.tech)': 'ECE',
      'electronics and communication engineering (m.tech)': 'ECE',
      'electronics (phd)': 'ECE',
      'electronics and communication engineering (phd)': 'ECE',

      'mechanical': 'ME',
      'mechanical engineering': 'ME',
      'me': 'ME',
      'mech': 'ME',
      'mechanical (b.tech)': 'ME',
      'mechanical engineering (b.tech)': 'ME',
      'mechanical (m.tech)': 'ME',
      'mechanical engineering (m.tech)': 'ME',
      'mechanical (phd)': 'ME',
      'mechanical engineering (phd)': 'ME',

      'smart manufacturing': 'SM',
      'sm': 'SM',
      'smart manufacturing (b.tech)': 'SM',
      'smart manufacturing (m.tech)': 'SM',
      'smart manufacturing (phd)': 'SM',

      'design': ['Design', 'Des.', 'DES', 'Des'],
      'design (b.des)': ['Design', 'Des.', 'DES', 'Des'],
      'design (m.des)': ['Design', 'Des.', 'DES', 'Des'],
      'design (phd)': ['Design', 'Des.', 'DES', 'Des'],
    };

    const targetBatchCode = branchMappings[normalizedBranch];
    
    if (targetBatchCode) {
      // Handle array of possible codes (for Design) or single code
      const possibleCodes = Array.isArray(targetBatchCode) ? targetBatchCode : [targetBatchCode];
      
      const foundBatch = batches.find(batch => {
        const matches = {
          displayBranch: possibleCodes.some(code => batch.displayBranch === code),
          discipline: possibleCodes.some(code => batch.discipline === code),
          branch: possibleCodes.some(code => batch.branch === code),
          nameIncludes: possibleCodes.some(code => batch.name?.includes(code))
        };
        
        return matches.displayBranch || matches.discipline || matches.branch || matches.nameIncludes;
      });
      
      if (foundBatch) {
        return foundBatch;
      }
    }

    // Enhanced fallback matching with better design pattern recognition
    for (const batch of batches) {
      const batchBranch = (batch.displayBranch || batch.discipline || batch.branch || '').toLowerCase();
      
      // Special handling for design variations
      const isDesignBatch = batchBranch.includes('des') || batchBranch.includes('design');
      const isDesignStudent = normalizedBranch.includes('design') || normalizedBranch.includes('des');
      
      let fallbackMatch = false;
      
      if (isDesignStudent && isDesignBatch) {
        // Both are design-related, consider it a match
        fallbackMatch = true;
      } else {
        // Standard fallback matching
        fallbackMatch = batchBranch.includes(normalizedBranch) || normalizedBranch.includes(batchBranch);
      }
      
      if (fallbackMatch) {
        return batch;
      }
    }
    
    return null;
  };

  // Function to handle student branch transfer
  const handleBranchTransfer = async (studentData, oldBatch, newBatch) => {
    try {
      notifications.show({
        title: "Branch Transfer",
        message: `Student ${studentData.name || studentData.Name || 'Unknown'} is being transferred from ${oldBatch?.displayBranch || 'current batch'} to ${newBatch?.displayBranch || 'new batch'}`,
        color: "blue",
        autoClose: 5000,
      });

      if (selectedBatch && (selectedBatch.id === oldBatch?.id)) {
        setStudentList((prev) => 
          prev.filter(student => 
            (student.id || student.student_id) !== (studentData.id || studentData.student_id)
          )
        );
      }

      const updateBatchCount = (batches, setBatches, batchId, delta) => {
        setBatches(prev => prev.map(batch => {
          if (batch.id === batchId) {
            return {
              ...batch,
              studentsCount: Math.max(0, (batch.studentsCount || 0) + delta),
              studentCount: Math.max(0, (batch.studentCount || 0) + delta)
            };
          }
          return batch;
        }));
      };

      if (oldBatch) {
        if (activeSection === 'ug') {
          updateBatchCount(ugBatches, setUgBatches, oldBatch.id, -1);
        } else if (activeSection === 'pg') {
          updateBatchCount(pgBatches, setPgBatches, oldBatch.id, -1);
        } else if (activeSection === 'phd') {
          updateBatchCount(phdBatches, setPhdBatches, oldBatch.id, -1);
        }
      }

      if (newBatch) {
        if (activeSection === 'ug') {
          updateBatchCount(ugBatches, setUgBatches, newBatch.id, 1);
        } else if (activeSection === 'pg') {
          updateBatchCount(pgBatches, setPgBatches, newBatch.id, 1);
        } else if (activeSection === 'phd') {
          updateBatchCount(phdBatches, setPhdBatches, newBatch.id, 1);
        }
      }

      fetchBatchData();
      
      return true;
    } catch (error) {
      console.error('Branch transfer error:', error);
      notifications.show({
        title: "Transfer Error",
        message: `Failed to transfer student: ${error.message}`,
        color: "red",
      });
      return false;
    }
  };

  const dispatch = useDispatch();
  const { userDetails } = useSelector((state) => state.user);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [activeSection, setActiveSection] = useState(PROGRAMME_TYPES.UG);
  const [ugBatches, setUgBatches] = useState([]);
  const [pgBatches, setPgBatches] = useState([]);
  const [phdBatches, setPhdBatches] = useState([]);
  const [batchData, setBatchData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [selectedBatchYear, setSelectedBatchYear] = useState(() => getCurrentBatchYear());
  const [viewAcademicYear, setViewAcademicYear] = useState(() => getCurrentBatchYear()); 

  useEffect(() => {
    const currentYear = getCurrentBatchYear();
    setSelectedBatchYear(currentYear);
    setViewAcademicYear(currentYear);
  }, [activeSection]);

  useEffect(() => {
    setNewBatchData(prev => ({
      ...prev,
      year: selectedBatchYear
    }));
  }, [selectedBatchYear]);

  const getFieldMapping = () => {
    const mapping = {};
    Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
      mapping[fieldKey] = STUDENT_FIELDS_CONFIG[fieldKey].excelColumns;
    });
    return mapping;
  };

  const getFieldDisplayName = (fieldName) => {
    return STUDENT_FIELDS_CONFIG[fieldName]?.label || fieldName;
  };

  const getAvailableFields = () => {
    return Object.keys(STUDENT_FIELDS_CONFIG);
  };

  // Helper function to parse backend duplicate errors and return user-friendly messages
  const parseDuplicateError = (error, context = "operation") => {
    let errorMessage = `Failed to ${context}`;
    let errorTitle = "Error";

    if (error.response?.data?.message) {
      const backendMessage = error.response.data.message.toLowerCase();

      if (
        backendMessage.includes("jee_app_no") &&
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate JEE Application Number";
        errorMessage = context.includes("upload")
          ? "One or more JEE Application Numbers already exist in the database. Please check your Excel file and remove duplicates."
          : "This JEE Application Number already exists in the database. Please check and enter a different number.";
      }
      else if (
        backendMessage.includes("roll_number") &&
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate Roll Number";
        errorMessage = context.includes("upload")
          ? "One or more Institute Roll Numbers already exist in the database. Please check your Excel file and remove duplicates."
          : "This Institute Roll Number already exists in the database. Please check and enter a different number.";
      }
      else if (
        backendMessage.includes("institute_email") &&
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate Institute Email";
        errorMessage = context.includes("upload")
          ? "One or more Institute Email IDs already exist in the database. Please check your Excel file and remove duplicates."
          : "This Institute Email ID already exists in the database. Please check and enter a different email.";
      }
  
      else if (
        backendMessage.includes("duplicate key") ||
        backendMessage.includes("already exists")
      ) {
        errorTitle = "Duplicate Entries";
        errorMessage = context.includes("upload")
          ? "Some entries in your Excel file already exist in the database. Please check for duplicate JEE App Numbers, Roll Numbers, and Institute Emails."
          : "Some information you entered already exists in the database. Please check JEE App No, Roll Number, and Institute Email for duplicates.";
      }
      else {
        errorMessage = error.response.data.message || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { title: errorTitle, message: errorMessage };
  };

  const validateRequiredFields = (formData, isEditMode = false) => {
    const errors = {};

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

    const dropdownFields = [
      "gender",
      "category",
      "allottedGender",
      "allottedCategory",
      "pwd",
      "branch",
    ];

    switch (step) {
      case 0: 
        fieldsToValidate = ["name", "fname", "mname", "gender", "category"];
        break;
      case 1:
        fieldsToValidate = ["pwd", "jeeAppNo", "address"];
        break;
      case 2: 
        fieldsToValidate = ["branch"];
        break;
      default:
        return errors;
    }

    if (isEditMode) {
      fieldsToValidate = fieldsToValidate.filter(
        (field) => !dropdownFields.includes(field),
      );
    }

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
  // Function to get current academic year based on date
  const getCurrentAcademicYear = () => {
    return getCurrentAcademicYearString();
  };

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

  const determineCorrectProgramme = (discipline, programmeType) => {
    const disciplineLower = (discipline || "").toLowerCase().trim();

    if (programmeType === "ug") {
      if (
        disciplineLower.includes("design") ||
        disciplineLower.includes("bdes")
      ) {
        return "B.Des";
      } else {
        return "B.Tech";
      }
    }

    if (programmeType === "pg") {
      if (
        disciplineLower.includes("design") ||
        disciplineLower.includes("mdes")
      ) {
        return "M.Des";
      } else {
        return "M.Tech";
      }
    }

    if (programmeType === "phd") {
      return "PhD";
    }

    return programmeType === "ug"
      ? "B.Tech"
      : programmeType === "pg"
        ? "M.Tech"
        : "PhD";
  };

  const getBranchCode = (branchName, branchCode, getDisplayCode = false) => {
    const branch = (branchName || branchCode || "").toLowerCase().trim();

    const branchMappings = {
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

      design: { display: "DES", rollCode: "BDS" },
      bdes: { display: "DES", rollCode: "BDS" },

      "mtech computer science": { display: "CSE", rollCode: "MCS" },
      "mtech electronics": { display: "ECE", rollCode: "MEC" },
      "mtech mechanical": { display: "ME", rollCode: "MME" },
      "mtech smart manufacturing": { display: "SM", rollCode: "MSM" },

      "mdes design": { display: "DES", rollCode: "MDS" },

      "phd computer science": { display: "CSE", rollCode: "PCS" },
      "phd electronics": { display: "ECE", rollCode: "PEC" },
      "phd mechanical": { display: "ME", rollCode: "PME" },
      "phd smart manufacturing": { display: "SM", rollCode: "PSM" },
      "phd design": { display: "DES", rollCode: "PDS" },
    };

    const matchedEntry = Object.entries(branchMappings).find(([key]) =>
      branch.includes(key),
    );
    if (matchedEntry) {
      const [, codes] = matchedEntry;
      return getDisplayCode ? codes.display : codes.rollCode;
    }

    const result = branchCode || "UNK";
    return result;
  };

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
    const yearSuffix = year.toString().slice(-2);
    const sequenceNumber = sequence.toString().padStart(3, "0");
    return `${yearSuffix}${branchCode}${sequenceNumber}`;
  };

  // Function to generate institute email
  const generateInstituteEmail = (rollNumber) => {
    return `${rollNumber.toLowerCase()}@iiitdmj.ac.in`;
  };

  // Main batch allocation algorithm
  const processBatchAllocation = (studentData, programmeType) => {
    const batchYear = parseInt(selectedBatchYear, 10);
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

    Object.keys(branchGroups).forEach((branchCode) => {
      branchGroups[branchCode].sort((a, b) => a.name.localeCompare(b.name));
    });

    const processedStudents = [];
    const branchCounters = {};

    Object.keys(branchGroups).forEach((branchCode) => {
      branchCounters[branchCode] = 1;

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
          reportedStatus: "NOT_REPORTED",
        });

        branchCounters[branchCode] += 1;
      });
    });

    processedStudents.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    return {
      students: processedStudents,
      summary: {
        totalStudents: processedStudents.length,
        branchCounts: Object.keys(branchCounters).reduce((acc, branch) => {
          acc[branch] = branchCounters[branch] - 1;
          return acc;
        }, {}),
        year: selectedBatchYear,
        academicYear: getCurrentAcademicYear(),
        programme: programmeType.toUpperCase(),
        allocationDate: new Date().toISOString(),
      },
    };
  };

  const addStudentToExistingBatch = (processedStudent) => {
    const { programme, displayBranch, branchCode } = processedStudent;
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

    const existingBatchIndex = currentBatches.findIndex(
      (batch) =>
        batch.displayBranch === displayBranch ||
        batch.discipline.includes(displayBranch),
    );

    if (existingBatchIndex !== -1) {
      currentBatches[existingBatchIndex].students.push(processedStudent);
      currentBatches[existingBatchIndex].filledSeats += 1;
      currentBatches[existingBatchIndex].availableSeats = Math.max(
        0,
        currentBatches[existingBatchIndex].totalSeats -
          currentBatches[existingBatchIndex].filledSeats,
      );
    } else {
      const newBatch = {
        id: Date.now(),
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
        year: parseInt(selectedBatchYear, 10),
        totalSeats: 60,
        filledSeats: 1,
        availableSeats: 59,
        students: [processedStudent],
      };
      currentBatches.push(newBatch);
    }

    setBatchFunction(currentBatches);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState(
    selectedBatchYear.toString(),
  );
  const [filterProgramme, setFilterProgramme] = useState("");

  const [modalOpened, setModalOpened] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [entryMode, setEntryMode] = useState("excel");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState([]);

  const [processedBatchData, setProcessedBatchData] = useState(null);
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [showBatchPreview, setShowBatchPreview] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [manualFormData, setManualFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editTotalSeats, setEditTotalSeats] = useState("");
  const [seatsUpdateLoading, setSeatsUpdateLoading] = useState(false);

  const [editingRow, setEditingRow] = useState(null); 
  const [editFormData, setEditFormData] = useState({}); 
  const [showAddBatchModal, setShowAddBatchModal] = useState(false); 
  const [newBatchData, setNewBatchData] = useState({
    programme: "",
    discipline: "",
    year: selectedBatchYear,
    totalSeats: 60,
  });
  const [deletingBatchId, setDeletingBatchId] = useState(null); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteStudentConfirm, setShowDeleteStudentConfirm] =
    useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [updatingReportStatus, setUpdatingReportStatus] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isBulkReporting, setIsBulkReporting] = useState(false);

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});
  const [exportFormat, setExportFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [selectAllFields, setSelectAllFields] = useState(true);

  const fetchBatchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Authorization token not found");
      const response = await axios.get(
        `${host}/programme_curriculum/api/batches/sync/`,
        {
          headers: { Authorization: `Token ${token}` },
        },
      );

      if (response.data && response.data.success) {
        const allBatches = response.data.batches || [];

        const mappedBatches = allBatches.map(batch => ({
          id: batch.batch_id,
          name: batch.name,
          programme: batch.name,
          discipline: batch.discipline,
          displayBranch: batch.discipline,
          year: batch.year,
          totalSeats: batch.total_seats,
          total_seats: batch.total_seats,
          filledSeats: batch.filled_seats,
          filled_seats: batch.filled_seats,
          student_count: batch.filled_seats,
          availableSeats: batch.available_seats,
          available_seats: batch.available_seats,
          curriculum: batch.curriculum,
          curriculum_name: batch.curriculum,
          curriculumId: batch.curriculum_id,
          curriculum_id: batch.curriculum_id,
          status: batch.status
        }));

        const categorizedBatches = categorizeBatchesByProgramme(mappedBatches);

        setUgBatches(categorizedBatches.ug);
        setPgBatches(categorizedBatches.pg);
        setPhdBatches(categorizedBatches.phd);

        const allBatchesUnified = [
          ...normalizeBatchData(categorizedBatches.ug),
          ...normalizeBatchData(categorizedBatches.pg),
          ...normalizeBatchData(categorizedBatches.phd)
        ];
        
        setBatchData({
          upcoming_batches: allBatchesUnified,
          current_batches: allBatchesUnified,
          ug: normalizeBatchData(categorizedBatches.ug),
          pg: normalizeBatchData(categorizedBatches.pg),
          phd: normalizeBatchData(categorizedBatches.phd)
        });

        await syncBatchData();
      } else {
        throw new Error(response.message || "Failed to fetch batch data");
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load batch data. Please try again.",
        color: "red",
      });

      setUgBatches([]);
      setPgBatches([]);
      setPhdBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const categorizeBatchesByProgramme = (allBatches) => {
    const categorized = {
      ug: [],
      pg: [],
      phd: [],
    };

    allBatches.forEach((batch) => {
      const programme = (batch.programme || "").trim();
      const name = (batch.name || "").trim();
      const discipline = (batch.discipline || "").toLowerCase();
      const displayBranch = (batch.displayBranch || "").toLowerCase();

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

  useEffect(() => {
    fetchBatchData();
  }, []);

  useEffect(() => {
    setFilterProgramme("");
    syncBatchData();
  }, [activeSection]);

  useEffect(() => {
  }, [manualFormData]);

  // Handle editing student data mapping
  useEffect(() => {
    if (editingStudent && showAddModal && addMode === "manual") {
      const isFormEmpty = !manualFormData.name && !manualFormData.fname && !manualFormData.category;
      
      if (isFormEmpty) {
        const studentData = {};
        Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
        const fieldConfig = STUDENT_FIELDS_CONFIG[fieldKey];
        let value = "";

        if (
          editingStudent[fieldKey] !== undefined &&
          editingStudent[fieldKey] !== null &&
          editingStudent[fieldKey] !== ""
        ) {
          value = editingStudent[fieldKey];
          
          if (fieldKey === "category") {
            const categoryMapping = {
              "General": "GEN",
              "Other Backward Class": "OBC", 
              "Scheduled Caste": "SC",
              "Scheduled Tribe": "ST",
              "Economically Weaker Section": "EWS"
            };
            value = categoryMapping[value] || value;
          }
        }
        else if (fieldConfig.backendField && editingStudent[fieldConfig.backendField] !== undefined &&
          editingStudent[fieldConfig.backendField] !== null &&
          editingStudent[fieldConfig.backendField] !== "") {
          value = editingStudent[fieldConfig.backendField];

          if (fieldKey === "category") {
            const categoryMapping = {
              "General": "GEN",
              "Other Backward Class": "OBC", 
              "Scheduled Caste": "SC",
              "Scheduled Tribe": "ST",
              "Economically Weaker Section": "EWS"
            };
            value = categoryMapping[value] || value;
          }
        }
        else if (fieldConfig.excelColumns) {
          for (const excelCol of fieldConfig.excelColumns) {
            const colValue = editingStudent[excelCol];
            if (
              colValue !== undefined &&
              colValue !== null &&
              colValue !== ""
            ) {
              value = colValue;
              if (fieldKey === "category") {
                const categoryMapping = {
                  "General": "GEN",
                  "Other Backward Class": "OBC", 
                  "Scheduled Caste": "SC",
                  "Scheduled Tribe": "ST",
                  "Economically Weaker Section": "EWS"
                };
                value = categoryMapping[value] || value;
              }
              break;
            }
          }
        }

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
            gender: ["Gender"],
            category: ["Category"],
            allottedCategory: ["allottedcat", "allotted_category", "Allotted Cat"],
            allottedGender: ["allotted_gender", "Allotted Gender"],
            pwd: ["PWD"],
            branch: ["Branch", "discipline", "Discipline"],
          };

          const variations = specialMappings[fieldKey] || [];

          for (const variation of variations) {
            if (
              editingStudent[variation] !== undefined &&
              editingStudent[variation] !== null &&
              editingStudent[variation] !== ""
            ) {
              value = editingStudent[variation];

              if (fieldKey === "category") {
                const categoryMapping = {
                  "General": "GEN",
                  "Other Backward Class": "OBC", 
                  "Scheduled Caste": "SC",
                  "Scheduled Tribe": "ST",
                  "Economically Weaker Section": "EWS"
                };
                value = categoryMapping[value] || value;
              }
              break;
            }
          }
        }

        studentData[fieldKey] = value || "";
      });

      setManualFormData(studentData);
      }
    }
  }, [editingStudent, showAddModal, addMode]);

  useEffect(() => {
    if (showExportModal && Object.keys(selectedFields).length === 0) {
      initializeSelectedFields();
    }
  }, [showExportModal]);

  useEffect(() => {
  }, [viewAcademicYear]);


  const getCurrentBatches = () => {
    let allBatches;
    
    if (activeSection === "ug") allBatches = ugBatches || [];
    else if (activeSection === "pg") allBatches = pgBatches || [];
    else allBatches = phdBatches || [];

    if (allBatches.length > 0) {
      /* console.log('Debug - First batch data structure from unified API:', {
        sampleBatch: allBatches[0],
        curriculum: allBatches[0].curriculum,
        curriculum_name: allBatches[0].curriculum_name,
        allFields: Object.keys(allBatches[0]),
        fullBatchObject: allBatches[0],
        id: allBatches[0].id,
        name: allBatches[0].name,
        programme: allBatches[0].programme,
        discipline: allBatches[0].discipline,
        year: allBatches[0].year,
        totalSeats: allBatches[0].totalSeats,
        total_seats: allBatches[0].total_seats,
        filledSeats: allBatches[0].filledSeats,
        filled_seats: allBatches[0].filled_seats,
        student_count: allBatches[0].student_count,
        availableSeats: allBatches[0].availableSeats,
        available_seats: allBatches[0].available_seats,
        curriculumId: allBatches[0].curriculumId,
        curriculum_id: allBatches[0].curriculum_id,
      }); */
    }

    const processedBatches = allBatches.map(batch => {
      const totalSeats = batch.totalSeats || batch.total_seats || 80;
      const filledSeats = batch.filledSeats || batch.filled_seats || batch.student_count || 0;
      const availableSeats = Math.max(0, totalSeats - filledSeats);
      
      return {
        ...batch,
        totalSeats,
        filledSeats,
        availableSeats,
        name: batch.name || batch.programme || "Unknown",
        curriculum: batch.curriculum || batch.curriculum_name || "N/A",
        curriculumVersion: batch.curriculumVersion || batch.curriculum_version || null,
      };
    });
    
    // Filter out incomplete batches (those with missing essential data)
    const validBatches = processedBatches.filter(batch => {
      const hasYear = batch.year;
      const hasNameOrProgramme = (batch.name && batch.name.trim() !== "") || (batch.programme && batch.programme.trim() !== "");
      const hasDisciplineOrSeats = (batch.discipline && batch.discipline.trim() !== "") || batch.totalSeats > 0 || batch.filledSeats > 0;
      
      const isValid = hasYear && (hasNameOrProgramme || hasDisciplineOrSeats);

      if (!isValid) {
        console.log('Filtering out incomplete batch:', {
          batch: batch,
          hasYear: hasYear,
          hasNameOrProgramme: hasNameOrProgramme,
          hasDisciplineOrSeats: hasDisciplineOrSeats,
          name: batch.name,
          programme: batch.programme,
          discipline: batch.discipline,
          year: batch.year,
          totalSeats: batch.totalSeats,
          filledSeats: batch.filledSeats
        });
      }
      
      return isValid;
    });
    return validBatches.filter(batch => batch.year === viewAcademicYear);
  };

  // Automatically sync batch data using backend API
  const syncBatchData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }

      const response = await fetch(`${host}/programme_curriculum/api/batches/sync/`, {
        method: 'GET',
        headers: headers
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Sync endpoint not available yet, skipping auto-sync...');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        // Map the sync API response to the expected format
        const mappedBatches = data.batches.map(batch => ({
          id: batch.batch_id,
          name: batch.name,
          programme: batch.name,
          discipline: batch.discipline,
          displayBranch: batch.discipline,
          year: batch.year,
          totalSeats: batch.total_seats,
          total_seats: batch.total_seats,
          filledSeats: batch.filled_seats, // Accurate count from sync API
          filled_seats: batch.filled_seats,
          student_count: batch.filled_seats,
          availableSeats: batch.available_seats,
          available_seats: batch.available_seats,
          curriculum: batch.curriculum,
          curriculum_name: batch.curriculum,
          curriculumId: batch.curriculum_id,
          curriculum_id: batch.curriculum_id,
          status: batch.status
        }));
        
        setBatchData({
          upcoming_batches: mappedBatches,
          current_batches: mappedBatches,
          ug: mappedBatches.filter(b => b.name.includes('B.')),
          pg: mappedBatches.filter(b => b.name.includes('M.')),
          phd: mappedBatches.filter(b => b.name.toLowerCase().includes('phd'))
        });
        
        console.log('Batch data synchronized automatically');
      } else {
        console.warn('Sync failed:', data.message);
      }
    } catch (error) {
      if (!error.message.includes('Unexpected token') && !error.message.includes('<!doctype')) {
        console.error('Auto-sync error:', error);
      } else {
        console.log('Sync endpoint not ready yet, skipping...');
      }
    }
  };

  const getCurrentBatchesForValidation = () => {
    return getCurrentBatches();
  };
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

    const matchesViewYear = batch.year === viewAcademicYear;

    return matchesSearch && matchesYear && matchesProgramme && matchesViewYear;
  });

  // Handle file upload for Excel - Now connected to backend with enhanced programme detection
  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    if (file) {
      setIsProcessing(true);
      setUploadProgress(10);

      try {
        setUploadProgress(30);

        const preProcessedData = await preProcessExcelFile(file);

        console.log("Uploading file:", file);
        console.log("Programme type:", activeSection);
        console.log("File details:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        const response = await processExcelUpload(file, activeSection);

        console.log("Backend response:", response);
        console.log("Response structure:", {
          success: response.success,
          valid_students: response.valid_students?.length,
          valid_records: response.valid_records,
          message: response.message
        });

        setUploadProgress(80);

        console.log("Checking success condition:", response.success);

        if (response.success) {
          console.log("Success path taken - processing student data");
          setExtractedData(response.valid_students);
          setUploadProgress(100);

          notifications.show({
            title: "Success",
            message: `Excel file processed successfully! ${response.valid_records} valid records found.`,
            color: "green",
          });

          const validStudents = response.valid_students || [];
          const invalidStudents = response.invalid_students || [];

          const invalidStudentData = invalidStudents.map((item) => ({
            ...item.data,
            _validation_error: item.error, 
            _row_number: item.row,
          }));

          const allStudents = [...validStudents, ...invalidStudentData];

          const disciplineGroups = allStudents.reduce((groups, student) => {
            const discipline =
              student.branch || student.discipline || "Unknown";
            if (!groups[discipline]) {
              groups[discipline] = [];
            }
            groups[discipline].push(student);
            return groups;
          }, {});

          if (allStudents.length > 0) {
          }

          setExtractedData(allStudents);
          setShowPreview(true);
        } else {
          console.log("Success condition failed - response:", response);
          console.log("Response.success value:", response.success, typeof response.success);
          throw new Error(response.message || "Failed to process Excel file");
        }
      } catch (error) {
        setUploadProgress(0);

        console.error("Excel upload error:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("Error headers:", error.response?.headers);

        const errorData = error.response?.data;
        const errorMessage = errorData?.message || errorData?.error || error.message;

        if (errorMessage?.includes("No working curriculums found")) {
          showWorkflowGuidance('curriculum_required');
        } else if (errorMessage?.includes("No active batches found")) {
          showWorkflowGuidance('batches_required', { 
            academicYear: getViewAcademicYearOptions()[0]?.label || 'current year'
          });
        } else if (errorMessage?.includes("have no curriculum assigned")) {
          // Extract batch names from error message
          const batchMatch = errorMessage.match(/assigned: (.+?)\./);
          const batchNames = batchMatch ? batchMatch[1] : "some batches";
          
          showWorkflowGuidance('curriculum_assignment_required', { batchNames });
        } else if (errorMessage?.includes("validation") || errorMessage?.includes("prerequisite")) {
          notifications.show({
            title: "📋 Validation Error",
            message: errorMessage,
            color: "red",
            autoClose: 8000,
            style: {
              backgroundColor: '#f8d7da',
              borderColor: '#f5c6cb',
              color: '#721c24',
            },
          });
        } else {
          // General error notification
          notifications.show({
            title: "❌ Upload Error",
            message: errorMessage || "Failed to process Excel file. Please check the format and try again.",
            color: "red",
            autoClose: 6000,
            style: {
              backgroundColor: '#f8d7da',
              borderColor: '#f5c6cb',
              color: '#721c24',
            },
          });
        }
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Function to apply case conversion rules
  const applyCaseConversion = (student) => {
    const convertedStudent = { ...student };
    const emailFields = [
      "email",
      "instituteEmail",
      "personalEmail",
      "personal_email",
      "institute_email",
    ];
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
          convertedStudent[key] = value.toLowerCase().trim();
          if (key === "instituteEmail" || key === "email") {
          }
        } else if (fieldsToConvert.includes(key)) {
          convertedStudent[key] = value.toUpperCase().trim();
          if (key === "name" || key === "rollNumber") {
          }
        } else {
          convertedStudent[key] = value.trim();
        }
      }
    });

    return convertedStudent;
  };

  // Export utility functions
  const getExportableFields = () => {
    return Object.keys(STUDENT_FIELDS_CONFIG)
      .filter((key) => !STUDENT_FIELDS_CONFIG[key].systemGenerated) 
      .map((key) => ({
        key,
        label: STUDENT_FIELDS_CONFIG[key].label,
        type: STUDENT_FIELDS_CONFIG[key].type,
      }));
  };

  const initializeSelectedFields = () => {
    const fields = {};
    getExportableFields().forEach((field) => {
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
      setSelectAllFields(false);
    }
  };

  const prepareExportData = (students, selectedFieldKeys) => {
    const priorityFields = [
      "rollNumber",
      "jeeAppNo",
      "name",
      "instituteEmail",
      "gender",
      "category",
      "allottedGender",
      "allottedCategory",
      "pwd",
      "dob",
      "phoneNumber",
      "email",
      "address",
      "state",
      "branch",
      "jeeRank",
      "categoryRank",
      "fname",
      "fatherOccupation",
      "fatherMobile",
      "mname",
      "motherOccupation",
      "motherMobile", 
    ];

    // Sort selected fields to maintain priority order
    const sortedFieldKeys = [
      ...priorityFields.filter((field) => selectedFieldKeys.includes(field)),
      ...selectedFieldKeys.filter((field) => !priorityFields.includes(field)),
    ];

    return students.map((student, index) => {
      const exportRow = {};

      exportRow["S.No"] = index + 1;

      sortedFieldKeys.forEach((fieldKey) => {
        const fieldConfig = STUDENT_FIELDS_CONFIG[fieldKey];
        let value = "";

        if (fieldKey === "fname") {
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
          value =
            student.dob ||
            student.date_of_birth ||
            student.dateOfBirth ||
            student["Date of Birth"] ||
            student["date of birth"] ||
            student["birth date"] ||
            "";
        } else if (fieldKey === "jeeRank") {
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

          if (!value && fieldConfig.excelColumns) {
            for (const excelCol of fieldConfig.excelColumns) {
              if (student[excelCol]) {
                value = student[excelCol];
                break;
              }
              const exactMatch = Object.keys(student).find(
                (key) => key.toLowerCase() === excelCol.toLowerCase(),
              );
              if (exactMatch && student[exactMatch]) {
                value = student[exactMatch];
                break;
              }
            }
          }

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

        if (
          !value &&
          ["fname", "mname", "name", "email", "jeeRank"].includes(fieldKey)
        ) {
        }
      });

      return exportRow;
    });
  };

  const exportToExcel = (data, filename) => {
    const wb = XLSX.utils.book_new();

    if (data.length > 0) {
      const firstRow = data[0];
      const orderedKeys = [];

      if (firstRow["S.No"] !== undefined) {
        orderedKeys.push("S.No");
      }

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

      Object.keys(firstRow).forEach((key) => {
        if (!orderedKeys.includes(key)) {
          orderedKeys.push(key);
        }
      });

      const orderedData = data.map((row) => {
        const orderedRow = {};
        orderedKeys.forEach((key) => {
          orderedRow[key] = row[key] || "";
        });
        return orderedRow;
      });

      const ws = XLSX.utils.json_to_sheet(orderedData, { header: orderedKeys });

      const colWidths = orderedKeys.map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Students");
    } else {
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

    const firstRow = data[0];
    const orderedKeys = [];

    if (firstRow["S.No"] !== undefined) {
      orderedKeys.push("S.No");
    }

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

  const transformDataForDatabase = (studentList) => {
    if (studentList?.length > 0) {
    }

    return studentList.map((student) => {
      const transformedStudent = {};

      Object.keys(STUDENT_FIELDS_CONFIG).forEach((fieldKey) => {
        const fieldInfo = STUDENT_FIELDS_CONFIG[fieldKey];

        let fieldValue = student[fieldKey];

        if (!fieldValue && fieldInfo.backendField) {
          fieldValue = student[fieldInfo.backendField];
        }

        if (!fieldValue && fieldInfo.excelColumns) {
          for (const excelCol of fieldInfo.excelColumns) {
            if (student[excelCol]) {
              fieldValue = student[excelCol];
              break;
            }
            const exactMatch = Object.keys(student).find(
              (key) => key.toLowerCase() === excelCol.toLowerCase(),
            );
            if (exactMatch && student[exactMatch]) {
              fieldValue = student[exactMatch];
              break;
            }
          }
        }

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

        transformedStudent[fieldKey] = fieldValue || "";
        if (
          ["phoneNumber", "email", "jeeAppNo", "dob", "jeeRank"].includes(
            fieldKey,
          )
        ) {
        }
      });

      Object.assign(
        transformedStudent,
        applyCaseConversion(transformedStudent),
      );

      transformedStudent.id = student.id;
      transformedStudent._validation_error = student._validation_error;

      return transformedStudent;
    });
  };

  // Show missing batch requirement modal
  const showBatchRequirementModal = (missingBatches) => {
    const missingBatchesText = missingBatches?.map(batch => 
      `• ${batch.acronym} - ${batch.discipline}\n  Action: ${batch.action_required}`
    ).join('\n') || 'Some required batches are missing';

    notifications.show({
      title: "⚠️ Batches Required",
      message: (
        <div>
          <Text size="sm" mb={8}>
            <strong>The following batches must be created before uploading students:</strong>
          </Text>
          <Text size="xs" style={{ whiteSpace: 'pre-line', fontFamily: 'monospace', color: '#721c24' }}>
            {missingBatchesText}
          </Text>
          <Text size="xs" mt={8} style={{ color: '#856404' }}>
            Please create these batches first via the Batch Management section, then try uploading students again.
          </Text>
        </div>
      ),
      color: "orange",
      autoClose: false,
    });
  };

  // Enhanced Excel upload with workflow validation
  const validateBatchPrerequisites = async (academicYear) => {
    try {
      const response = await fetch(`${host}/programme_curriculum/api/batches/validate_prerequisites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ academic_year: academicYear })
      });
      
      // Check if response is JSON (not HTML error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Backend validation endpoint not ready, using frontend validation...');
        return validateBatchPrerequisitesFrontend(academicYear);
      }
      
      const data = await response.json();
      
      if (!data.can_upload_students) {
        const errorMessages = data.missing_batches.slice(0, 5).map(batch => 
          `• ${batch.acronym} - ${batch.discipline}: ${batch.action_required}`
        ).join('\n');
        
        const additionalErrors = data.missing_batches.length > 5 ? 
          `\n... and ${data.missing_batches.length - 5} more missing batches` : '';
        
        notifications.show({
          title: "❌ Batches Required",
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>Please create required batches first:</strong>
              </Text>
              <Text size="xs" style={{ whiteSpace: 'pre-line', color: '#721c24' }}>
                {errorMessages}{additionalErrors}
              </Text>
            </div>
          ),
          color: "red",
          autoClose: false,
        });
        return false;
      }
      
      return true;
    } catch (error) {
      if (error.message.includes('Unexpected token') || error.message.includes('<!doctype')) {
        console.log('Backend validation not available, using frontend validation...');
        return validateBatchPrerequisitesFrontend(academicYear);
      }
      
      console.error('Batch validation error:', error);
      return true; 
    }
  };

  const validateBatchPrerequisitesFrontend = (academicYear) => {
    const currentBatches = getCurrentBatches();
    
    if (!currentBatches || currentBatches.length === 0) {
      notifications.show({
        title: "❌ No Batches Found",
        message: "Please create batches first before uploading students.",
        color: "red",
        autoClose: false,
      });
      return false;
    }

    const currentYear = getCurrentBatchYear();
    const batchesForYear = currentBatches.filter(batch => batch.year === currentYear);
    
    if (batchesForYear.length === 0) {
      notifications.show({
        title: "❌ No Batches for Current Year",
        message: `Please create batches for year ${currentYear} first.`,
        color: "red",
        autoClose: false,
      });
      return false;
    }
    
    return true;
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
      const currentAcademicYear = getCurrentBatchYear();
      const canUpload = await validateBatchPrerequisites(currentAcademicYear);
      
      if (!canUpload) {
        return;
      }

      const currentBatches = getCurrentBatchesForValidation();
      const batchValidationErrors = [];
      const studentBatchMap = new Map();
      
      for (const student of dataToUpload) {
        const studentBranch = student.branch || student.discipline || student.Branch || student.Discipline;
        const studentYear = getCurrentBatchYear(); 
        
        // Find matching batch for this student using the proper branch mapping logic
        const matchingBatch = getBatchForBranch(studentBranch, currentBatches);
        
        // If getBatchForBranch didn't find a match, also try direct comparison with year filter
        let finalMatchingBatch = matchingBatch;
        if (!finalMatchingBatch) {
          finalMatchingBatch = currentBatches.find(batch => {
            const batchBranch = batch.discipline || batch.branch;
            return (
              batchBranch === studentBranch &&
              batch.year === studentYear
            );
          });
        }
        
        // Additional check to ensure the matched batch is for the correct year
        if (finalMatchingBatch && finalMatchingBatch.year !== studentYear) {
          finalMatchingBatch = null;
        }
        
        if (!finalMatchingBatch) {
          batchValidationErrors.push({
            student: student.name || student.Name || 'Unknown',
            branch: studentBranch,
            year: studentYear,
            message: `No existing batch found for ${studentBranch} ${studentYear}`
          });
        } else {
          // Check if batch has available seats
          const studentsForThisBatch = studentBatchMap.get(finalMatchingBatch.id) || [];
          studentsForThisBatch.push(student);
          studentBatchMap.set(finalMatchingBatch.id, studentsForThisBatch);
          
          const totalStudentsForBatch = (finalMatchingBatch.filledSeats || 0) + studentsForThisBatch.length;
          if (totalStudentsForBatch > finalMatchingBatch.totalSeats) {
            batchValidationErrors.push({
              student: student.name || student.Name || 'Unknown',
              branch: studentBranch,
              year: studentYear,
              message: `Batch ${studentBranch} ${studentYear} will exceed capacity (${totalStudentsForBatch}/${finalMatchingBatch.totalSeats})`
            });
          }
        }
      }

      if (batchValidationErrors.length > 0) {
        const errorMessages = batchValidationErrors.slice(0, 5).map(error => 
          `• ${error.student}: ${error.message}`
        ).join('\n');
        
        const additionalErrors = batchValidationErrors.length > 5 ? 
          `\n... and ${batchValidationErrors.length - 5} more errors` : '';
        
        notifications.show({
          title: "❌ Upload Failed - Batch Validation Errors",
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>Cannot upload students. Please create required batches first:</strong>
              </Text>
              <Text size="xs" style={{ whiteSpace: 'pre-line', color: '#721c24' }}>
                {errorMessages}{additionalErrors}
              </Text>
            </div>
          ),
          color: "red",
          autoClose: false,
        });
        return;
      }

      const transformedData = transformDataForDatabase(dataToUpload);
      const response = await saveStudentsBatch(transformedData, activeSection);

      if (response.success) {
        const uploadCount =
          response.data.successful_uploads || response.data.saved_count || 0;

        notifications.show({
          title: "✅ Upload Successful",
          message: `${uploadCount} students uploaded to existing batches successfully!`,
          color: "green",
        });

        setShowAddModal(false);
        setAddMode(null);
        setUploadedFile(null);
        setExtractedData([]);
        setProcessedBatchData(null);
        setAllocationSummary(null);
        setShowBatchPreview(false);
        setShowPreview(false);
        
        // Refresh main batch data
        fetchBatchData(); 
        syncBatchData();
        
        // If student modal is open, refresh the student list too
        if (showStudentModal && selectedBatch) {
          handleBatchRowClick(selectedBatch);
        }

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Handle specific error codes from backend
        if (response.error_code === 'BATCH_NOT_FOUND') {
          notifications.show({
            title: "❌ Batch Required",
            message: response.required_action || response.message,
            color: "red",
            autoClose: false,
          });
        } else if (response.error_code === 'BATCH_MATCHING_ERROR') {
          notifications.show({
            title: "❌ Configuration Error",
            message: response.message,
            color: "red",
            autoClose: false,
          });
        } else {
          throw new Error(response.message || "Failed to upload students");
        }
      }
    } catch (error) {
      console.error("Save students batch error:", error);
      
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error.message;

      if (errorMessage?.includes("No working curriculums found")) {
        showWorkflowGuidance('curriculum_required');
      } else if (errorMessage?.includes("No active batches found")) {
        showWorkflowGuidance('batches_required', { 
          academicYear: getViewAcademicYearOptions()[0]?.label || 'current year'
        });
      } else if (errorMessage?.includes("have no curriculum assigned")) {
        const batchMatch = errorMessage.match(/assigned: (.+?)\./);
        const batchNames = batchMatch ? batchMatch[1] : "some batches";
        
        showWorkflowGuidance('curriculum_assignment_required', { batchNames });
      } else if (errorMessage?.includes("validation") || errorMessage?.includes("prerequisite")) {
        notifications.show({
          title: "📋 Validation Error",
          message: errorMessage,
          color: "red",
          autoClose: 8000,
          style: {
            backgroundColor: '#f8d7da',
            borderColor: '#f5c6cb',
            color: '#721c24',
          },
        });
      } else {
        // Parse duplicate error for user-friendly message
        const { title, message } = parseDuplicateError(error, "upload students");

        notifications.show({
          title,
          message,
          color: "red",
          autoClose: 8000,
        });
      }
    }
  };

  // Manual form navigation and submission
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

        // Validate workflow prerequisites for new students (not for updates)
        if (!editingStudent) {
          const currentAcademicYear = getCurrentBatchYear();
          const canUpload = await validateBatchPrerequisites(currentAcademicYear);
          
          if (!canUpload) {
            return;
          }

          const currentBatches = getCurrentBatchesForValidation();
          const studentBranch = manualFormData.branch;
          const studentYear = getCurrentBatchYear();

          // Find matching batch using the proper branch mapping logic
          let matchingBatch = getBatchForBranch(studentBranch, currentBatches);
          
          // If getBatchForBranch didn't find a match, also try direct comparison with year filter
          if (!matchingBatch) {
            matchingBatch = currentBatches.find(batch => {
              const batchBranch = batch.discipline || batch.branch;
              
              return (
                batchBranch === studentBranch &&
                batch.year === studentYear
              );
            });
          }
          
          // Additional check to ensure the matched batch is for the correct year
          if (matchingBatch && matchingBatch.year !== studentYear) {
            matchingBatch = null;
          }
          
          if (!matchingBatch) {
            notifications.show({
              title: "❌ Cannot Add Student",
              message: (
                <div>
                  <Text size="sm" mb={8}>
                    <strong>No existing batch found for this student.</strong>
                  </Text>
                  <Text size="xs" style={{ color: '#721c24' }}>
                    Please create a batch for {studentBranch} {studentYear} first.
                  </Text>
                </div>
              ),
              color: "red",
              autoClose: false,
            });
            return;
          }
          
          // Check if batch has available seats
          const totalStudentsForBatch = (matchingBatch.filledSeats || 0) + 1;
          if (totalStudentsForBatch > matchingBatch.totalSeats) {
            notifications.show({
              title: "❌ Batch Full",
              message: (
                <div>
                  <Text size="sm" mb={8}>
                    <strong>Cannot add student - batch capacity exceeded.</strong>
                  </Text>
                  <Text size="xs" style={{ color: '#721c24' }}>
                    Batch {studentBranch} {studentYear} is full ({matchingBatch.filledSeats}/{matchingBatch.totalSeats} seats)
                  </Text>
                </div>
              ),
              color: "red",
              autoClose: false,
            });
            return;
          }
        }

        if (editingStudent) {
          const oldBranch = editingStudent.branch || editingStudent.Branch || editingStudent.discipline || editingStudent.Discipline;
          const newBranch = manualFormData.branch;
          const branchChanged = oldBranch && newBranch && oldBranch.toLowerCase().trim() !== newBranch.toLowerCase().trim();
          const updateData = { ...transformedData[0] };

          let targetBatch = null;
          if (branchChanged) {
            const currentBatches = activeSection === 'ug' ? ugBatches : 
                                 activeSection === 'pg' ? pgBatches : phdBatches;
            targetBatch = getBatchForBranch(newBranch, currentBatches);
            
            if (!targetBatch) {
              notifications.show({
                title: "Branch Transfer Warning",
                message: `No batch found for branch "${newBranch}". Student will be updated but may need manual batch assignment.`,
                color: "yellow",
                autoClose: 7000,
              });
            }
          }

          const response = await updateStudent(
            editingStudent.id || editingStudent.student_id,
            updateData,
          );

          if (response.success) {
            let successMessage = "Student updated successfully!";
            
            // Handle branch transfer if needed
            if (branchChanged && targetBatch) {
              await handleBranchTransfer(updateData, selectedBatch, targetBatch);
              successMessage = `Student successfully transferred from ${selectedBatch?.displayBranch || 'current batch'} to ${targetBatch.displayBranch} batch!`;
            } else if (branchChanged) {
              successMessage += ` Branch updated to "${newBranch}" but no matching batch found for automatic transfer.`;
            }
            
            notifications.show({
              title: branchChanged ? "Transfer Completed" : "Update Successful",
              message: successMessage,
              color: "green",
              autoClose: branchChanged ? 8000 : 4000,
            });

            setStudentList((prev) =>
              prev.map((student) => {
                if (
                  (student.id || student.student_id) ===
                  (editingStudent.id || editingStudent.student_id)
                ) {
                  const updatedStudent = { ...student, ...updateData };
                  setEditingStudent(updatedStudent);
                  return updatedStudent;
                }
                return student;
              }),
            );

            setShowAddModal(false);
            setEditingStudent(null);
            setCurrentStep(0);
            setManualFormData(INITIAL_FORM_DATA);
            setErrors({});

            setShowStudentModal(false);
            setSelectedBatch(null);

            fetchBatchData();

            // Refresh the entire window to ensure all data is up to date
            setTimeout(() => {
              window.location.reload();
            }, branchChanged ? 2000 : 1500); // Longer delay for branch transfers
          } else {
            throw new Error(response.message || "Failed to update student");
          }
        } else {
          // Add debugging for Design students specifically
          if (transformedData[0].branch === "Design" || transformedData[0].branch?.toLowerCase().includes("design")) {
            console.log("🎨 DESIGN STUDENT DEBUG - Frontend Data:", {
              originalFormData: manualFormData,
              transformedData: transformedData[0],
              branch: transformedData[0].branch,
              activeSection: activeSection,
              currentYear: getCurrentBatchYear(),
              availableBatches: getCurrentBatchesForValidation().map(b => ({
                id: b.id,
                programme: b.programme,
                discipline: b.discipline,
                branch: b.branch,
                year: b.year,
                displayBranch: b.displayBranch
              }))
            });
          }

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

            setShowAddModal(false);
            setAddMode(null);
            setCurrentStep(0);
            setManualFormData(INITIAL_FORM_DATA);
            setErrors({});
            
            // Refresh main batch data
            fetchBatchData(); 
            syncBatchData();
            
            // If student modal is open, refresh the student list too
            if (showStudentModal && selectedBatch) {
              handleBatchRowClick(selectedBatch);
            }

            // Refresh the entire window to ensure all data is up to date
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            if (response.error_code === 'BATCH_NOT_FOUND') {
              notifications.show({
                title: "❌ Batch Required",
                message: response.required_action || response.message,
                color: "red",
                autoClose: false,
              });
            } else if (response.error_code === 'BATCH_MATCHING_ERROR') {
              notifications.show({
                title: "❌ Configuration Error", 
                message: response.message,
                color: "red",
                autoClose: false,
              });
            } else {
              throw new Error(response.message || "Failed to add student");
            }
          }
        }
      } catch (error) {
        console.error("Add/Update student error:", error);
        
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || errorData?.error || error.message;

        if (errorMessage?.includes("No working curriculums found")) {
          showWorkflowGuidance('curriculum_required');
        } else if (errorMessage?.includes("No active batches found")) {
          showWorkflowGuidance('batches_required', { 
            academicYear: getViewAcademicYearOptions()[0]?.label || 'current year'
          });
        } else if (errorMessage?.includes("have no curriculum assigned")) {
          const batchMatch = errorMessage.match(/assigned: (.+?)\./);
          const batchNames = batchMatch ? batchMatch[1] : "some batches";
          
          showWorkflowGuidance('curriculum_assignment_required', { batchNames });
        } else if (errorMessage?.includes("validation") || errorMessage?.includes("prerequisite")) {
          notifications.show({
            title: "📋 Validation Error",
            message: errorMessage,
            color: "red",
            autoClose: 8000,
            style: {
              backgroundColor: '#f8d7da',
              borderColor: '#f5c6cb',
              color: '#721c24',
            },
          });
        } else {
          const operationType = editingStudent ? "update student" : "add student";
          const { title, message } = parseDuplicateError(error, operationType);

          notifications.show({
            title,
            message,
            color: "red",
            autoClose: 8000,
          });
        }
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setErrors({}); 
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

      const result = await createBatch(batchToAdd);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "New batch created successfully",
          color: "green",
        });

        fetchBatchData();
        setShowAddBatchModal(false);
        setNewBatchData({
          programme: "",
          discipline: "",
          year: selectedBatchYear,
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

      const result = await updateBatch(editingRow, batchDataToUpdate);

      if (result.success) {
        notifications.show({
          title: "Success",
          message: "Batch updated successfully",
          color: "green",
        });

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
          title: "✅ Batch Deleted Successfully",
          message: (
            <div>
              <Text size="sm" mb={8}>
                <strong>{result.message || "Batch deleted successfully"}</strong>
              </Text>
              {result.deleted_batch && (
                <Text size="xs" color="gray.7">
                  Deleted: {result.deleted_batch.name} ({result.deleted_batch.discipline_acronym || result.deleted_batch.discipline}) - {result.deleted_batch.year}
                </Text>
              )}
            </div>
          ),
          color: "green",
          autoClose: 6000,
          style: {
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb',
            color: '#155724',
          },
        });

        fetchBatchData();
        syncBatchData();
        setShowDeleteConfirm(false);
        setDeletingBatchId(null);
      } else {
        throw new Error(result.message || "Failed to delete batch");
      }
    } catch (error) {
      console.error("Delete batch error:", error);
      
      let errorMessage = "Failed to delete batch";
      let errorTitle = "❌ Delete Failed";

      // Handle different types of errors with enhanced validation messages
      if (error.response) {
        const errorData = error.response.data;
        
        if (error.response.status === 400) {
          if (errorData?.validation_error === "batch_has_students") {
            errorTitle = "👥 Cannot Delete - Students Enrolled";
            errorMessage = `${errorData.message || "This batch has students enrolled. Please transfer or remove students first."}`;
            
            notifications.show({
              title: errorTitle,
              message: (
                <div>
                  <Text size="sm" mb={8}>
                    <strong>{errorMessage}</strong>
                  </Text>
                  <Text size="xs" color="gray.7">
                    Student count: {errorData.student_count || "Unknown"}<br/>
                    You must move these students to another batch or remove them before deletion.
                  </Text>
                </div>
              ),
              color: "orange",
              autoClose: 10000,
              style: {
                backgroundColor: '#fff3cd',
                borderColor: '#ffeaa7',
                color: '#856404',
              },
            });
            return;
            
          } else if (errorData?.validation_error === "discipline_has_students") {
            errorTitle = "🚫 Cannot Delete - Discipline Protected";
            errorMessage = `${errorData.message || "The discipline has students in the database."}`;
            
            notifications.show({
              title: errorTitle,
              message: (
                <div>
                  <Text size="sm" mb={8}>
                    <strong>{errorMessage}</strong>
                  </Text>
                  <Text size="xs" color="gray.7">
                    Discipline student count: {errorData.discipline_student_count || "Unknown"}<br/>
                    The entire discipline must be empty before deleting any batch in this discipline.
                  </Text>
                </div>
              ),
              color: "red",
              autoClose: 12000,
              style: {
                backgroundColor: '#f8d7da',
                borderColor: '#f5c6cb',
                color: '#721c24',
              },
            });
            return;
            
          } else {
            errorMessage =
              errorData?.message ||
              errorData?.error ||
              "Cannot delete batch - it may have associated students or dependencies";
          }
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

      // Default error notification for non-validation errors
      notifications.show({
        title: errorTitle,
        message: errorMessage,
        color: "red",
        autoClose: 6000,
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

  // SYNC DATA: Ensure both "Batches" and "Upcoming Batches" tabs show identical data
  const syncBatchDataBetweenTabs = () => {
    if (!batchData) return;
    
    const allBatches = [
      ...(batchData.upcoming_batches || []),
      ...(batchData.current_batches || [])
    ];

    const uniqueBatches = allBatches.reduce((acc, batch) => {
      const key = `${batch.programme}-${batch.discipline}-${batch.year}`;
      if (!acc[key] || (acc[key].id > batch.id)) {
        acc[key] = batch;
      }
      return acc;
    }, {});
    
    const syncedBatches = Object.values(uniqueBatches);

    setBatchData(prevData => ({
      ...prevData,
      upcoming_batches: syncedBatches,
      current_batches: syncedBatches,
    }));

    const ugBatches = syncedBatches.filter(batch => batch.programme?.toLowerCase().includes('ug') || batch.programme?.toLowerCase().includes('b.'));
    const pgBatches = syncedBatches.filter(batch => batch.programme?.toLowerCase().includes('pg') || batch.programme?.toLowerCase().includes('m.'));
    const phdBatches = syncedBatches.filter(batch => batch.programme?.toLowerCase().includes('phd'));
    
    setUgBatches(ugBatches);
    setPgBatches(pgBatches);
    setPhdBatches(phdBatches);
  };

  // Synchronize total seats between tabs (both tabs get updated)
  const syncTotalSeatsAcrossTabs = (batchToUpdate, newTotalSeats) => {
    const syncBatches = (batches) => {
      return batches.map((batch) => {
        if (
          batch.programme === batchToUpdate.programme &&
          batch.discipline === batchToUpdate.discipline &&
          batch.year === batchToUpdate.year
        ) {
          const availableSeats = Math.max(0, newTotalSeats - (batch.filledSeats || 0));
          return {
            ...batch,
            totalSeats: newTotalSeats,
            availableSeats: availableSeats,
          };
        }
        return batch;
      });
    };

    setBatchData(prevData => {
      if (!prevData) return prevData;
      
      const syncedUpcoming = syncBatches(prevData.upcoming_batches || []);
      const syncedCurrent = syncBatches(prevData.current_batches || []);
      
      return {
        ...prevData,
        upcoming_batches: syncedUpcoming,
        current_batches: syncedCurrent, 
      };
    });

    if (activeSection === PROGRAMME_TYPES.UG) {
      setUgBatches(prev => syncBatches(prev));
    } else if (activeSection === PROGRAMME_TYPES.PG) {
      setPgBatches(prev => syncBatches(prev));
    } else if (activeSection === PROGRAMME_TYPES.PHD) {
      setPhdBatches(prev => syncBatches(prev));
    }
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
      const result = await setTotalSeats({
        programme: batch.programme,
        discipline: batch.discipline,
        year: batch.year,
        totalSeats: newTotalSeats,
      });

      if (result.success) {
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

        if (activeSection === PROGRAMME_TYPES.UG) {
          setUgBatches((prev) => updateBatches(prev));
        } else if (activeSection === PROGRAMME_TYPES.PG) {
          setPgBatches((prev) => updateBatches(prev));
        } else if (activeSection === PROGRAMME_TYPES.PHD) {
          setPhdBatches((prev) => updateBatches(prev));
        }

        syncTotalSeatsAcrossTabs(batch, newTotalSeats);

        notifications.show({
          title: "Success",
          message: `Total seats updated to ${newTotalSeats} for ${batch.programme} - ${batch.discipline}`,
          color: "green",
        });

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

  const handleBatchRowClick = async (batch) => {
    setSelectedBatch(batch);
    setShowStudentModal(true);
    
    if (selectedBatch && selectedBatch.id === batch.id && showStudentModal) {
      return;
    }

    let students = batch.students || [];
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${host}/programme_curriculum/api/batches/${batch.id}/students/`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();

        const uploadStudents = data.upload_students || [];
        const academicStudents = data.academic_students || [];

        const combinedStudents = [...uploadStudents, ...academicStudents];

        const seenStudents = new Set();
        students = combinedStudents.filter(student => {

          const identifier = student.id || 
                           student.student_id || 
                           student.jee_app_no || 
                           student.jeeAppNo ||
                           student.roll_number || 
                           student.rollNumber ||
                           student.institute_email ||
                           student.instituteEmail ||
                           `${student.name}_${student.dob || student.date_of_birth}`;
          
          if (seenStudents.has(identifier)) {
            return false;
          }
          
          seenStudents.add(identifier);
          return true;
        });
      } else {
        console.error('Failed to fetch students:', response.status);
        await fetchBatchesWithStudents(batch);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      await fetchBatchesWithStudents(batch);
    }
    
    setStudentList(students);
  };

  // Fallback function to fetch batch with students from main API (only for student details, not counts)
  const fetchBatchesWithStudents = async (targetBatch) => {
    try {
      console.log('Fetching batch with students from main API as fallback...');
      const token = localStorage.getItem("authToken");
      // Note: Using admin_batches here only for fetching individual student records, 
      // not for filled_seats counts which should use batches/sync/ endpoint
      const response = await fetch(
        `${host}/programme_curriculum/api/admin_batches/?include_students=true`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const batch = data.find(b => b.id === targetBatch.id);
        
        if (batch && (batch.students || batch.upload_students || batch.academic_students)) {
          let students = batch.students || [];
          
          // If students are in separate arrays, combine and deduplicate
          if (!students.length && (batch.upload_students || batch.academic_students)) {
            const uploadStudents = batch.upload_students || [];
            const academicStudents = batch.academic_students || [];
            const combinedStudents = [...uploadStudents, ...academicStudents];
            
            const seenStudents = new Set();
            students = combinedStudents.filter(student => {
              const identifier = student.id || 
                               student.student_id || 
                               student.jee_app_no || 
                               student.jeeAppNo ||
                               student.roll_number || 
                               student.rollNumber ||
                               `${student.name}_${student.dob || student.date_of_birth}`;
              
              if (seenStudents.has(identifier)) {
                return false;
              }
              seenStudents.add(identifier);
              return true;
            });
          }
          
          console.log('Fallback: Found students from main API:', students.length);
          setStudentList(students);
        } else {
          console.log('Fallback: No students found in main API response');
          setStudentList([]);
        }
      } else {
        console.error('Fallback API also failed:', response.status);
        setStudentList([]);
      }
    } catch (error) {
      console.error('Fallback fetch error:', error);
      setStudentList([]);
    }
  };

  // API function to update student reported status
  const updateStudentStatus = async (requestData) => {
    try {
      const token = localStorage.getItem("authToken");
      
      const payload = {
        studentId: requestData.studentId,  
        reportedStatus: requestData.newStatus || requestData.reportedStatus, 
        batchId: requestData.batchId || selectedBatch?.id           
      };

      const response = await fetch(
        `${host}/programme_curriculum/api/admin_update_student_status/`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Student status updated successfully:', data);
        return { success: true, data };
      } else {
        console.error('❌ Failed to update student status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData };
      }
      
    } catch (error) {
      console.error('❌ Error updating student status:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle reported status change for students (now supports three states)
  const handleReportedStatusChange = async (studentId, newStatus) => {
    setUpdatingReportStatus(studentId);

    try {
      const requestData = {
        studentId: studentId,
        newStatus: newStatus,
        batchId: selectedBatch.id,
      };

      const result = await updateStudentStatus(requestData);

      if (result.success) {
        setStudentList((prev) =>
          prev.map((student) =>
            (student.id === studentId || student.student_id === studentId)
              ? { 
                  ...student, 
                  reportedStatus: newStatus,
                  reported_status: newStatus 
                }
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
                    ? { ...student, reportedStatus: newStatus, reported_status: newStatus }
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
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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

  const handleReportedStatusToggle = async (studentId, currentStatus) => {
    const newStatus = currentStatus === "REPORTED" ? "NOT_REPORTED" : "REPORTED";
    await handleReportedStatusChange(studentId, newStatus);
  };

  // Helper function to get status display properties
  const getStatusProperties = (status) => {
    switch (status) {
      case "REPORTED":
        return { 
          color: "green", 
          variant: "filled", 
          icon: "✓", 
          label: "Reported" 
        };
      case "WITHDRAWAL":
        return { 
          color: "red", 
          variant: "filled", 
          icon: "⚠", 
          label: "Withdrawal" 
        };
      case "NOT_REPORTED":
      default:
        return { 
          color: "orange", 
          variant: "outline", 
          icon: "○", 
          label: "Not Reported" 
        };
    }
  };

  // Bulk selection functionality
  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    
    // Update "select all" state
    const allStudentIds = getFilteredStudents().map(student => student.id || student.student_id);
    setIsAllSelected(allStudentIds.length > 0 && allStudentIds.every(id => newSelected.has(id)));
  };

  const handleSelectAll = () => {
    const allStudentIds = getFilteredStudents().map(student => student.id || student.student_id);
    if (isAllSelected) {
      setSelectedStudents(new Set());
      setIsAllSelected(false);
    } else {
      setSelectedStudents(new Set(allStudentIds));
      setIsAllSelected(true);
    }
  };

  // Generalized bulk status change function
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedStudents.size === 0) {
      notifications.show({
        title: "No Selection",
        message: "Please select at least one student to update.",
        color: "orange",
      });
      return;
    }

    setIsBulkReporting(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      // Process each selected student
      for (const studentId of selectedStudents) {
        const student = getFilteredStudents().find(s => (s.id || s.student_id) === studentId);
        if (student) {
          try {
            const result = await updateStudentStatus({
              studentId: studentId,
              reportedStatus: newStatus,
              batchId: selectedBatch.id,
            });

            if (result.success) {
              successCount++;
              setStudentList(prevList =>
                prevList.map(student =>
                  (student.id || student.student_id) === studentId
                    ? { ...student, reportedStatus: newStatus, reported_status: newStatus }
                    : student
                )
              );

              const updateBatchData = (batchArray) =>
                batchArray.map((batch) => ({
                  ...batch,
                  students: batch.students?.map((student) =>
                    (student.id || student.student_id) === studentId
                      ? { ...student, reportedStatus: newStatus, reported_status: newStatus }
                      : student
                  ),
                }));

              setUgBatches(updateBatchData);
              setPgBatches(updateBatchData);
              setPhdBatches(updateBatchData);
            } else {
              failureCount++;
            }
          } catch (error) {
            failureCount++;
          }
        }
      }

      const statusLabel = newStatus.replace('_', ' ').toLowerCase();
      
      // Show results notification
      if (successCount > 0 && failureCount === 0) {
        notifications.show({
          title: "Bulk Status Update Completed",
          message: `Successfully updated ${successCount} students to ${statusLabel}.`,
          color: "green",
        });

        // Refresh the entire window after successful bulk update
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Slightly longer delay for bulk operations
      } else if (successCount > 0 && failureCount > 0) {
        notifications.show({
          title: "Partial Success",
          message: `Updated ${successCount} students to ${statusLabel} successfully. ${failureCount} failed.`,
          color: "yellow",
        });

        // Refresh the window even for partial success to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        notifications.show({
          title: "Bulk Status Update Failed",
          message: `Failed to update students to ${statusLabel}. Please try again.`,
          color: "red",
        });
      }

      // Clear selection after bulk operation
      setSelectedStudents(new Set());
      setIsAllSelected(false);

    } catch (error) {
      notifications.show({
        title: "Error",
        message: "An error occurred during bulk status update. Please try again.",
        color: "red",
      });
    } finally {
      setIsBulkReporting(false);
    }
  };

  const handleBulkReport = async () => {
    await handleBulkStatusChange("REPORTED");
  };

  // Clear selection when batch changes
  useEffect(() => {
    setSelectedStudents(new Set());
    setIsAllSelected(false);
  }, [selectedBatch]);

  const handleExport = async () => {
    try {
      notifications.show({
        title: "Export Started",
        message: "Generating student data export...",
        color: "blue",
      });

      const response = await exportStudentData(activeSection, {
        year: selectedBatchYear,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${activeSection}_students_${selectedBatchYear}.xlsx`,
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
    setEditingStudent(student);

    setShowStudentModal(false);
    setShowAddModal(true);
    setAddMode("manual");
    setCurrentStep(0); 

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
      const response = await deleteStudent(studentId);

      if (response.success) {
        setStudentList((prev) => {
          const updated = prev.filter(
            (s) => (s.id || s.student_id) !== studentId,
          );
          return updated;
        });

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

        if (selectedBatch) {
          await fetchBatchData();
        }

        setShowStudentModal(false);
        setSelectedBatch(null);

        notifications.show({
          title: "Success",
          message: `Student "${studentName}" deleted successfully`,
          color: "green",
        });

        // Refresh the entire window to ensure all data is up to date
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to delete student");
      }
    } catch (error) {

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
        autoClose: false, 
      });

      if (selectedBatch) {
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
              onClick={() => {
                setSelectedBatchYear(getCurrentBatchYear());
                setShowAddModal(true);
              }}
              style={{
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
              }}
              leftSection={<Plus size={16} />}
            >
              Add Students
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

            {/* Academic Year Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                backgroundColor: "#e7f3ff",
                border: "1px solid #3498db",
                borderRadius: "6px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#2c5282" }}>
                📅 Academic Year:
              </span>
              <Select
                value={viewAcademicYear.toString()}
                onChange={(value) => setViewAcademicYear(parseInt(value, 10))}
                data={getViewAcademicYearOptions()}
                style={{ width: "100px" }}
                size="xs"
                variant="unstyled"
                styles={{
                  input: {
                    fontWeight: 600,
                    color: "#2c5282",
                    fontSize: "14px",
                    padding: "0 4px",
                    minHeight: "auto",
                    height: "auto",
                  },
                  dropdown: {
                    fontSize: "14px",
                  }
                }}
              />
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
                      Name
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
                      Discipline
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
                      Batch Year
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
                      Curriculum
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
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((batch, index) => (
                      <tr
                        key={batch.id || `batch-${index}`}
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
                            batch.name || batch.programme
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
                            batch.year
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
                          <Badge variant="light" color="cyan" size="sm">
                            {batch.curriculum || batch.curriculum_name || "N/A"}
                            {(batch.curriculumVersion || batch.curriculum_version) && ` v${batch.curriculumVersion || batch.curriculum_version}`}
                          </Badge>
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

                {/* Batch Year Selection */}
                <Stack spacing="xs" style={{ width: "100%", marginBottom: "20px" }}>
                  <Group position="center" spacing="md">
                    <Select
                      value={selectedBatchYear.toString()}
                      onChange={(value) => setSelectedBatchYear(parseInt(value, 10))}
                      data={getBatchYearOptions(activeSection)}
                      style={{ width: isMobile ? "250px" : "300px" }}
                      placeholder="Select batch year"
                      size="sm"
                    />
                  </Group>
                  <Text size="xs" color="dimmed" ta="center">
                    {selectedBatchYear && `Academic Year: ${batchYearToAcademicYear(selectedBatchYear)}`}
                  </Text>
                </Stack>

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

                                  const transformedData =
                                    transformDataForDatabase(extractedData);

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

                                    setExtractedData([]);
                                    setShowPreview(false);
                                    fetchBatchData();

                                    setTimeout(() => {
                                      window.location.reload();
                                    }, 2000);
                                  } else {
                                    throw new Error(
                                      response.message ||
                                        "Failed to save students",
                                    );
                                  }
                                } catch (error) {
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
                        setAddMode(null);
                        setEditingStudent(null);
                        setManualFormData(INITIAL_FORM_DATA);
                        setCurrentStep(0);
                        setErrors({});
                        setShowAddModal(false);
                        setShowStudentModal(true);
                      } else {
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
                            <Select
                              label={STUDENT_FIELDS_CONFIG.gender.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.gender.placeholder
                              }
                              value={manualFormData.gender || ""}
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
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <Select
                              label={STUDENT_FIELDS_CONFIG.category.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.category.placeholder
                              }
                              value={manualFormData.category || ""}
                              onChange={(value) => {
                                if (editingStudent) {
                                  setEditingStudent({
                                    ...editingStudent,
                                    category: value,
                                  });
                                }
                                setManualFormData({
                                  ...manualFormData,
                                  category: value,
                                });
                              }}
                              data={STUDENT_FIELDS_CONFIG.category.options}
                              required={
                                STUDENT_FIELDS_CONFIG.category.required
                              }
                              error={errors.category}
                            />
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
                            <Select
                              label={STUDENT_FIELDS_CONFIG.pwd.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.pwd.placeholder
                              }
                              value={manualFormData.pwd || ""}
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
                        <Select
                          label={STUDENT_FIELDS_CONFIG.branch.label}
                          placeholder={STUDENT_FIELDS_CONFIG.branch.placeholder}
                          value={manualFormData.branch || ""}
                          onChange={(value) => {
                            if (editingStudent) {
                              setEditingStudent({
                                ...editingStudent,
                                branch: value,
                              });
                            }
                            setManualFormData({
                              ...manualFormData,
                              branch: value,
                            });
                          }}
                          data={STUDENT_FIELDS_CONFIG.branch.options}
                          required={STUDENT_FIELDS_CONFIG.branch.required}
                          error={errors.branch}
                          searchable
                        />
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
                            <TextInput
                              label={STUDENT_FIELDS_CONFIG.allottedCategory.label}
                              placeholder={
                                STUDENT_FIELDS_CONFIG.allottedCategory.placeholder
                              }
                              value={manualFormData.allottedCategory || ""}
                              onChange={(e) =>
                                setManualFormData({
                                  ...manualFormData,
                                  allottedCategory: e.target.value,
                                })
                              }
                              required={
                                STUDENT_FIELDS_CONFIG.allottedCategory.required
                              }
                              error={errors.allottedCategory}
                            />
                          </Grid.Col>
                          <Grid.Col span={isMobile ? 12 : 6}>
                            <Select
                              label={
                                STUDENT_FIELDS_CONFIG.allottedGender.label
                              }
                              placeholder={
                                STUDENT_FIELDS_CONFIG.allottedGender.placeholder
                              }
                              value={manualFormData.allottedGender || ""}
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
                      <Stack spacing="lg" mt="lg">
                        <div style={{ textAlign: "center", marginBottom: "20px" }}>
                          <Title order={2} size="h3" weight={700} mb="xs" color="#2c3e50">
                            📋 Review & Submit
                          </Title>
                          <Text size="md" color="dimmed">
                            Please review all the information below before submitting
                          </Text>
                        </div>

                        {/* Basic Information Card */}
                        <div
                          style={{
                            backgroundColor: "#ffffff",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                            <div style={{ 
                              backgroundColor: "#3498db", 
                              borderRadius: "50%", 
                              width: "32px", 
                              height: "32px", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              marginRight: "12px"
                            }}>
                              <Text color="white" size="sm" weight={700}>👤</Text>
                            </div>
                            <Title order={4} weight={600} color="#2c3e50">
                              Basic Information
                            </Title>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>FULL NAME</Text>
                              <Text size="sm" weight={500}>{manualFormData.name || "Not provided"}</Text>
                            </div>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>FATHER'S NAME</Text>
                              <Text size="sm" weight={500}>{manualFormData.fname || "Not provided"}</Text>
                            </div>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>MOTHER'S NAME</Text>
                              <Text size="sm" weight={500}>{manualFormData.mname || "Not provided"}</Text>
                            </div>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>GENDER</Text>
                              <Text size="sm" weight={500}>{manualFormData.gender || "Not selected"}</Text>
                            </div>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>CATEGORY</Text>
                              <Text size="sm" weight={500}>{manualFormData.category || "Not selected"}</Text>
                            </div>
                            {manualFormData.phoneNumber && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>PHONE NUMBER</Text>
                                <Text size="sm" weight={500}>{manualFormData.phoneNumber}</Text>
                              </div>
                            )}
                            {manualFormData.email && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>PERSONAL EMAIL</Text>
                                <Text size="sm" weight={500}>{manualFormData.email}</Text>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Information Card */}
                        <div
                          style={{
                            backgroundColor: "#ffffff",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                            <div style={{ 
                              backgroundColor: "#27ae60", 
                              borderRadius: "50%", 
                              width: "32px", 
                              height: "32px", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              marginRight: "12px"
                            }}>
                              <Text color="white" size="sm" weight={700}>📄</Text>
                            </div>
                            <Title order={4} weight={600} color="#2c3e50">
                              Additional Information
                            </Title>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>PWD STATUS</Text>
                              <Text size="sm" weight={500}>{manualFormData.pwd || "Not specified"}</Text>
                            </div>
                            {manualFormData.dob && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>DATE OF BIRTH</Text>
                                <Text size="sm" weight={500}>{manualFormData.dob}</Text>
                              </div>
                            )}
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>JEE APPLICATION NO.</Text>
                              <Text size="sm" weight={500}>{manualFormData.jeeAppNo || "Not provided"}</Text>
                            </div>
                            {manualFormData.address && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px", gridColumn: "1 / -1" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>ADDRESS</Text>
                                <Text size="sm" weight={500}>{manualFormData.address}</Text>
                              </div>
                            )}
                            {manualFormData.state && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>STATE</Text>
                                <Text size="sm" weight={500}>{manualFormData.state}</Text>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Family Information Card */}
                        {(manualFormData.fatherOccupation || manualFormData.fatherMobile || manualFormData.motherOccupation || manualFormData.motherMobile) && (
                          <div
                            style={{
                              backgroundColor: "#ffffff",
                              padding: "20px",
                              borderRadius: "12px",
                              border: "1px solid #e9ecef",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                              <div style={{ 
                                backgroundColor: "#e67e22", 
                                borderRadius: "50%", 
                                width: "32px", 
                                height: "32px", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                                marginRight: "12px"
                              }}>
                                <Text color="white" size="sm" weight={700}>👨‍👩‍👧‍👦</Text>
                              </div>
                              <Title order={4} weight={600} color="#2c3e50">
                                Family Information
                              </Title>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                              {manualFormData.fatherOccupation && (
                                <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                  <Text size="xs" weight={600} color="dimmed" mb={2}>FATHER'S OCCUPATION</Text>
                                  <Text size="sm" weight={500}>{manualFormData.fatherOccupation}</Text>
                                </div>
                              )}
                              {manualFormData.fatherMobile && (
                                <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                  <Text size="xs" weight={600} color="dimmed" mb={2}>FATHER'S MOBILE</Text>
                                  <Text size="sm" weight={500}>{manualFormData.fatherMobile}</Text>
                                </div>
                              )}
                              {manualFormData.motherOccupation && (
                                <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                  <Text size="xs" weight={600} color="dimmed" mb={2}>MOTHER'S OCCUPATION</Text>
                                  <Text size="sm" weight={500}>{manualFormData.motherOccupation}</Text>
                                </div>
                              )}
                              {manualFormData.motherMobile && (
                                <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                  <Text size="xs" weight={600} color="dimmed" mb={2}>MOTHER'S MOBILE</Text>
                                  <Text size="sm" weight={500}>{manualFormData.motherMobile}</Text>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Academic Information Card */}
                        <div
                          style={{
                            backgroundColor: "#ffffff",
                            padding: "20px",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                            <div style={{ 
                              backgroundColor: "#9b59b6", 
                              borderRadius: "50%", 
                              width: "32px", 
                              height: "32px", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              marginRight: "12px"
                            }}>
                              <Text color="white" size="sm" weight={700}>🎓</Text>
                            </div>
                            <Title order={4} weight={600} color="#2c3e50">
                              Academic Information
                            </Title>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                            <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                              <Text size="xs" weight={600} color="dimmed" mb={2}>BRANCH</Text>
                              <Text size="sm" weight={500}>{manualFormData.branch || "Not selected"}</Text>
                            </div>
                            {manualFormData.jeeRank && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>AI RANK</Text>
                                <Text size="sm" weight={500}>{manualFormData.jeeRank}</Text>
                              </div>
                            )}
                            {manualFormData.categoryRank && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>CATEGORY RANK</Text>
                                <Text size="sm" weight={500}>{manualFormData.categoryRank}</Text>
                              </div>
                            )}
                            {manualFormData.allottedCategory && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>ALLOTTED CATEGORY</Text>
                                <Text size="sm" weight={500}>{manualFormData.allottedCategory}</Text>
                              </div>
                            )}
                            {manualFormData.allottedGender && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>ALLOTTED GENDER</Text>
                                <Text size="sm" weight={500}>{manualFormData.allottedGender}</Text>
                              </div>
                            )}
                            {manualFormData.rollNumber && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>INSTITUTE ROLL NUMBER</Text>
                                <Text size="sm" weight={500}>{manualFormData.rollNumber}</Text>
                              </div>
                            )}
                            {manualFormData.instituteEmail && (
                              <div style={{ padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                <Text size="xs" weight={600} color="dimmed" mb={2}>INSTITUTE EMAIL ID</Text>
                                <Text size="sm" weight={500}>{manualFormData.instituteEmail}</Text>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Confirmation Message */}
                        <div
                          style={{
                            backgroundColor: "#d4edda",
                            padding: "15px",
                            borderRadius: "8px",
                            border: "1px solid #c3e6cb",
                            textAlign: "center",
                          }}
                        >
                          <Text size="sm" color="#155724" weight={500}>
                            ✅ Please verify all the information above is correct before submitting
                          </Text>
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
                  {/* Bulk Status Change Buttons */}
                  {isViewingCurrentYear() && selectedStudents.size > 0 && (
                    <Group spacing="sm">
                      <Button
                        leftSection={<Check size={18} />}
                        onClick={() => handleBulkStatusChange("REPORTED")}
                        disabled={isBulkReporting}
                        loading={isBulkReporting}
                        variant="filled"
                        color="green"
                        size="md"
                        radius="md"
                        style={{
                          fontWeight: 500,
                          backgroundColor: "#16a34a",
                          minWidth: "130px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Report ({selectedStudents.size})
                      </Button>
                      <Button
                        leftSection={<Warning size={18} />}
                        onClick={() => handleBulkStatusChange("WITHDRAWAL")}
                        disabled={isBulkReporting}
                        loading={isBulkReporting}
                        variant="filled"
                        color="red"
                        size="md"
                        radius="md"
                        style={{
                          fontWeight: 500,
                          backgroundColor: "#dc2626",
                          minWidth: "130px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        Withdraw ({selectedStudents.size})
                      </Button>
                    </Group>
                  )}
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
                            left: "0px",
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
                            width: "140px",
                            position: "sticky",
                            left: "60px", // Position after S.No column
                            backgroundColor: "#f8fafc",
                            zIndex: 20,
                            borderRight: "2px solid #e2e8f0",
                            fontWeight: "bold",
                            fontSize: "13px",
                            borderBottom: "2px solid #e2e8f0",
                          }}
                        >
                          Roll Number
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
                        {isViewingCurrentYear() && (
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                              <span>Status</span>
                              <Checkbox
                                checked={isAllSelected}
                                indeterminate={
                                  selectedStudents.size > 0 && !isAllSelected
                                }
                                onChange={handleSelectAll}
                                size="sm"
                                color="blue"
                                label=""
                                aria-label="Select all students"
                              />
                            </div>
                          </th>
                        )}
                        {isViewingCurrentYear() && (
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
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStudents().map((student, index) => {
                        const uniqueKey = student.id || 
                                        student.student_id || 
                                        student.jee_app_no || 
                                        student.jeeAppNo ||
                                        student.roll_number || 
                                        student.rollNumber ||
                                        `student_${index}_${student.name}_${student.dob || student.date_of_birth}`;
                        
                        return (
                        <tr
                          key={uniqueKey}
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
                              left: "0px",
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
                              position: "sticky",
                              left: "60px",
                              backgroundColor: "#ffffff",
                              zIndex: 10,
                              borderRight: "2px solid #e5e7eb",
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
                          {isViewingCurrentYear() && (
                            <td
                              style={{
                                padding: "14px 12px",
                                textAlign: "center",
                                fontSize: "12px",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                {/* Status Display and Selection */}
                                <div style={{ minWidth: "120px" }}>
                                  <Select
                                    size="xs"
                                    variant="filled"
                                    data={[
                                      { value: "NOT_REPORTED", label: "○ Not Reported" },
                                      { value: "REPORTED", label: "✓ Reported" },
                                      { value: "WITHDRAWAL", label: "⚠ Withdrawal" }
                                    ]}
                                    value={student.reportedStatus || student.reported_status || "NOT_REPORTED"}
                                    onChange={(value) => handleReportedStatusChange(
                                      student.id || student.student_id, 
                                      value
                                    )}
                                    disabled={updatingReportStatus === (student.id || student.student_id)}
                                    styles={(theme) => {
                                      const currentStatus = student.reportedStatus || student.reported_status || "NOT_REPORTED";
                                      const statusProps = getStatusProperties(currentStatus);
                                      return {
                                        input: {
                                          backgroundColor: statusProps.color === "green" ? "#d4f7dc" : 
                                                         statusProps.color === "red" ? "#fde8e8" : "#fef3c7",
                                          color: statusProps.color === "green" ? "#047857" : 
                                                statusProps.color === "red" ? "#dc2626" : "#d97706",
                                          fontSize: "11px",
                                          fontWeight: "500",
                                          border: `1px solid ${statusProps.color === "green" ? "#10b981" : 
                                                               statusProps.color === "red" ? "#ef4444" : "#f59e0b"}`,
                                          cursor: "pointer"
                                        },
                                        dropdown: {
                                          fontSize: "11px"
                                        }
                                      };
                                    }}
                                  />
                                </div>
                                <Checkbox
                                  checked={selectedStudents.has(student.id || student.student_id)}
                                  onChange={() => handleSelectStudent(student.id || student.student_id)}
                                  size="sm"
                                  color="blue"
                                  label=""
                                  aria-label={`Select student ${student.name || student.Name}`}
                                />
                              </div>
                            </td>
                          )}
                          {isViewingCurrentYear() && (
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
                          )}
                        </tr>
                        );
                      })}
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
          title={
            <Flex align="center" gap="sm">
              <ThemeIcon color="red" size="lg">
                <Trash size={20} />
              </ThemeIcon>
              <Text size="lg" weight={600}>
                Confirm Delete Batch
              </Text>
            </Flex>
          }
          size="md"
          centered
        >
          <Stack spacing="md">
            {(() => {
              // Find the batch being deleted to show its details
              const batchToDelete = [...ugBatches, ...pgBatches, ...phdBatches]
                .find(batch => batch.id === deletingBatchId);
              
              return (
                <>
                  <Text>
                    Are you sure you want to delete this batch? This action cannot be undone.
                  </Text>
                  
                  {batchToDelete && (
                    <Card withBorder p="md" bg="gray.1">
                      <Text size="sm" weight={500} mb={8}>
                        Batch Details:
                      </Text>
                      <Text size="sm">
                        <strong>Name:</strong> {batchToDelete.name || `${batchToDelete.programme} ${batchToDelete.displayBranch || batchToDelete.discipline}`}
                      </Text>
                      <Text size="sm">
                        <strong>Discipline:</strong> {batchToDelete.displayBranch || batchToDelete.discipline}
                      </Text>
                      <Text size="sm">
                        <strong>Year:</strong> {batchToDelete.year}
                      </Text>
                      <Text size="sm">
                        <strong>Total Seats:</strong> {batchToDelete.totalSeats || 0}
                      </Text>
                      <Text size="sm">
                        <strong>Filled Seats:</strong> {batchToDelete.filledSeats || 0}
                      </Text>
                    </Card>
                  )}

                  <Alert icon={<Warning size={16} />} title="Deletion Restrictions" color="orange">
                    <Text size="sm">
                      • Cannot delete if this batch has enrolled students<br/>
                      • Cannot delete if ANY students exist in this discipline across ALL batches<br/>
                      • The entire discipline must be empty before deletion
                    </Text>
                  </Alert>
                </>
              );
            })()}

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                color="red" 
                onClick={handleDeleteBatch}
                leftSection={<Trash size={16} />}
              >
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

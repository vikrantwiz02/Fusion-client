// Shared shape of the printed assistantship sheet, so the Excel and the PDF
// stay the same document in two formats.
export const COLUMNS = [
  { header: "S.No", key: "s_no", excelWidth: 6, pdfWidth: 9 },
  { header: "Roll No.", key: "roll_no", excelWidth: 14, pdfWidth: 22 },
  { header: "Student Name", key: "student_name", excelWidth: 30, pdfWidth: 50 },
  { header: "Joining Date", key: "joining_date", excelWidth: 16, pdfWidth: 25 },
  { header: "Account No", key: "account_no", excelWidth: 20, pdfWidth: 28 },
  { header: "IFSC Code", key: "ifsc_code", excelWidth: 16, pdfWidth: 24 },
  { header: "Bank Name", key: "bank_name", excelWidth: 18, pdfWidth: 25 },
  {
    header: "No. of Days for which assistantship is recommended",
    key: "days",
    excelWidth: 22,
    pdfWidth: 26,
  },
  { header: "Amount", key: "amount", excelWidth: 14, pdfWidth: 22 },
  { header: "Remark", key: "remark", excelWidth: 28, pdfWidth: 47 },
];

export const INSTITUTE_LINES = [
  "PDPM",
  "Indian Institute of Information Technology,",
  "Design & Manufacturing Jabalpur",
];

export const NOTE = "* As per physical reporting at the institute";
export const OFFICE = "Office Assistant";

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const printedOn = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const amountOf = (row) => Number(row.payable || 0);

export const totalOf = (rows) =>
  rows.reduce((sum, row) => sum + amountOf(row), 0);

export const bodyRow = (row, index) => ({
  s_no: index + 1,
  roll_no: row.roll_no || "",
  student_name: row.student_name || "",
  joining_date: formatDate(row.joining_date),
  account_no: row.account_no || "",
  ifsc_code: row.ifsc_code || "",
  bank_name: row.bank_name || "",
  days: `${row.days} Days`,
  amount: amountOf(row),
  remark: row.remark || "",
});

export const recommendedLine = (name) =>
  name ? `Recommended By: Prof. ${name}` : "Recommended By:";

export const fileStem = ({ disciplineCode, monthName, year }) =>
  `assistantship_${disciplineCode}_${monthName}_${year}`;

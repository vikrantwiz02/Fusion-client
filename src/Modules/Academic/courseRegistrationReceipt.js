import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// The course registration receipt: student copy and academic copy on one page.
// Shared so the student's own download and the academic office's download of
// any student's receipt cannot drift apart.
export default function downloadCourseRegistrationReceipt({
  studentInfo,
  courses,
  totalCredits,
}) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const filename = `Course_Registration_${dateStr}.pdf`;
  // Printed on the day the receipt is generated, and the CPI carried forward.
  const printedOn = `${String(now.getDate()).padStart(2, "0")}.${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}.${now.getFullYear()}`;
  const prevCpiLabel = studentInfo.prevSemCpi
    ? `Prev. Sem. CPI: ${studentInfo.prevSemCpi}`
    : "Prev. Sem. CPI: -";

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "legal",
    });

    doc.setFont("helvetica");

    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT COPY", pageWidth / 2, yPosition, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${printedOn}`, pageWidth - 20, yPosition, {
      align: "right",
    });

    yPosition += 3;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const fields = [
      `Batch: ${studentInfo.batch || ""}`,
      `Name: ${studentInfo.name || ""}`,
      `Roll No.: ${studentInfo.rollNo || ""}`,
      `Branch: ${studentInfo.department || ""}`,
      `Semester: ${studentInfo.semester || ""}`,
    ];

    const tableWidth = pageWidth - 40;
    const tableStartX = 20;
    const tableEndX = pageWidth - 20;
    const availableWidth = tableEndX - tableStartX;

    const fieldWidths = fields.map((field) => doc.getTextWidth(field));
    const totalTextWidth = fieldWidths.reduce((sum, width) => sum + width, 0);

    const remainingSpace = availableWidth - totalTextWidth;
    const numberOfGaps = fields.length - 1;
    const gapWidth = numberOfGaps > 0 ? remainingSpace / numberOfGaps : 0;

    let currentX = tableStartX;
    fields.forEach((field, index) => {
      doc.text(field, currentX, yPosition, { align: "left" });
      currentX += fieldWidths[index] + gapWidth;
    });

    yPosition += 8;

    const tableData = [];

    courses.forEach((course, index) => {
      tableData.push([
        (index + 1).toString(),
        course.course_id?.code || "",
        course.course_id?.name || "",
        course.course_id?.credit?.toString() || "",
        course.registration_type || "",
        "",
      ]);
    });

    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          "S. No.",
          "Course ID",
          "Course Name",
          "Credits",
          "Reg. Type",
          "Remarks",
        ],
      ],
      body: tableData,
      theme: "grid",
      margin: { left: 20, right: 20 },
      tableWidth: pageWidth - 40,
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: "center" },
        1: {},
        2: {},
        3: { halign: "center" },
        4: { halign: "center" },
        5: {},
      },
    });

    yPosition = doc.lastAutoTable.finalY + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total Credits: ${totalCredits}`, 20, yPosition);
    doc.text(prevCpiLabel, pageWidth - 20, yPosition, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "1. I will maintain the attendance criteria according to academic guideline.",
      20,
      yPosition,
    );
    doc.text(
      "2. The above courses do not clash with any other courses.",
      20,
      yPosition + 3,
    );
    yPosition += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Additional notes:", 20, yPosition);
    yPosition += 5;

    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    const leftSigX = 50;
    const rightSigX = pageWidth - 70;

    doc.text("Student's Signature", leftSigX, yPosition + 8);
    doc.text("Admin's Signature", rightSigX, yPosition + 8);

    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 5, leftSigX + 50, yPosition + 5);
    doc.line(rightSigX - 20, yPosition + 5, pageWidth - 20, yPosition + 5);

    yPosition += 15;

    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setLineDashPattern([], 0);
    yPosition += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC COPY", pageWidth / 2, yPosition, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${printedOn}`, pageWidth - 20, yPosition, {
      align: "right",
    });

    yPosition += 3;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const academicFields = [
      `Batch: ${studentInfo.batch || ""}`,
      `Name: ${studentInfo.name || ""}`,
      `Roll No.: ${studentInfo.rollNo || ""}`,
      `Branch: ${studentInfo.department || ""}`,
      `Semester: ${studentInfo.semester || ""}`,
    ];

    const academicTableWidth = pageWidth - 40;
    const academicTableStartX = 20;
    const academicTableEndX = pageWidth - 20;
    const academicAvailableWidth = academicTableEndX - academicTableStartX;

    const academicFieldWidths = academicFields.map((field) =>
      doc.getTextWidth(field),
    );
    const academicTotalTextWidth = academicFieldWidths.reduce(
      (sum, width) => sum + width,
      0,
    );

    const academicRemainingSpace =
      academicAvailableWidth - academicTotalTextWidth;
    const academicNumberOfGaps = academicFields.length - 1;
    const academicGapWidth =
      academicNumberOfGaps > 0
        ? academicRemainingSpace / academicNumberOfGaps
        : 0;

    let academicCurrentX = academicTableStartX;
    academicFields.forEach((field, index) => {
      doc.text(field, academicCurrentX, yPosition, { align: "left" });
      academicCurrentX += academicFieldWidths[index] + academicGapWidth;
    });

    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [
        [
          "S. No.",
          "Course ID",
          "Course Name",
          "Credits",
          "Reg. Type",
          "Remarks",
        ],
      ],
      body: tableData,
      theme: "grid",
      margin: { left: 20, right: 20 },
      tableWidth: pageWidth - 40,
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        fontSize: 8,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: "center" },
        1: {},
        2: {},
        3: { halign: "center" },
        4: { halign: "center" },
        5: {},
      },
    });

    yPosition = doc.lastAutoTable.finalY + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total Credits: ${totalCredits}`, 20, yPosition);
    doc.text(prevCpiLabel, pageWidth - 20, yPosition, { align: "right" });
    yPosition += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "1. I will maintain the attendance criteria according to academic guideline.",
      20,
      yPosition,
    );
    doc.text(
      "2. The above courses do not clash with any other courses.",
      20,
      yPosition + 3,
    );
    yPosition += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Additional notes:", 20, yPosition);
    yPosition += 5;

    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    const academicLeftSigX = 50;
    const academicRightSigX = pageWidth - 70;

    doc.text("Student's Signature", academicLeftSigX, yPosition + 8);
    doc.text("Admin's Signature", academicRightSigX, yPosition + 8);

    doc.setLineWidth(0.3);
    doc.line(20, yPosition + 5, academicLeftSigX + 50, yPosition + 5);
    doc.line(
      academicRightSigX - 20,
      yPosition + 5,
      pageWidth - 20,
      yPosition + 5,
    );

    doc.save(filename);
  } catch (error) {
    alert(`Error generating PDF: ${error.message}. Please try again.`);
  }
}

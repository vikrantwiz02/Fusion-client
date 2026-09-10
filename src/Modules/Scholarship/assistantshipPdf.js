import { jsPDF as JsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  COLUMNS,
  INSTITUTE_LINES,
  NOTE,
  OFFICE,
  bodyRow,
  fileStem,
  printedOn,
  recommendedLine,
  totalOf,
} from "./assistantshipSheet";

// A4 landscape, narrow side margins, and a deeper top margin so the punch
// holes never bite into the header.
const MARGIN = { top: 34, bottom: 14, left: 8, right: 8 };

const [instituteName, ...instituteRest] = INSTITUTE_LINES;

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function exportAssistantshipPdf({
  discipline,
  disciplineCode,
  monthName,
  year,
  rows,
  recommendedBy,
}) {
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - MARGIN.right;

  const drawHeader = () => {
    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text(`Date: ${printedOn()}`, MARGIN.left, 12);

    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text(instituteName, right, 10, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9);
    instituteRest.forEach((line, i) => {
      doc.text(line, right, 14.5 + i * 4, { align: "right" });
    });

    doc.setFont("helvetica", "bold").setFontSize(11);
    doc.text(`${discipline} Discipline`, pageWidth / 2, 25, {
      align: "center",
    });
    doc.setFont("helvetica", "normal").setFontSize(9.5);
    doc.text(
      `Assistantship for the Month of ${monthName}, ${year}`,
      pageWidth / 2,
      29.5,
      { align: "center" },
    );
  };

  const body = rows.map((row, index) => {
    const cells = bodyRow(row, index);
    return COLUMNS.map((column) =>
      column.key === "amount" ? money(cells.amount) : String(cells[column.key]),
    );
  });

  const amountIndex = COLUMNS.findIndex((c) => c.key === "amount");
  const totalRow = COLUMNS.map((column, index) => {
    if (index === amountIndex) return money(totalOf(rows));
    if (index === amountIndex - 1) return "Total";
    return "";
  });

  const columnStyles = {};
  COLUMNS.forEach((column, index) => {
    columnStyles[index] = {
      cellWidth: column.pdfWidth,
      halign:
        column.key === "amount"
          ? "right"
          : column.key === "s_no"
            ? "center"
            : "left",
    };
  });

  autoTable(doc, {
    head: [COLUMNS.map((c) => c.header)],
    body: [...body, totalRow],
    startY: MARGIN.top,
    margin: { ...MARGIN },
    theme: "grid",
    // linebreak lets a long remark wrap and the row grow, instead of the text
    // being clipped.
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 1.4,
      overflow: "linebreak",
      valign: "middle",
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    columnStyles,
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === body.length) {
        data.cell.styles.fontStyle = "bold";
        if (data.column.index === amountIndex - 1) {
          data.cell.styles.halign = "right";
        }
      }
    },
    didDrawPage: () => {
      drawHeader();
      const page = doc.internal.getNumberOfPages();
      doc.setFont("helvetica", "normal").setFontSize(8);
      doc.text(`Page ${page}`, pageWidth / 2, pageHeight - 6, {
        align: "center",
      });
    },
  });

  // Signature block, kept whole: if it will not fit, it moves to a new page.
  const BLOCK_HEIGHT = 32;
  let y = doc.lastAutoTable.finalY + 8;
  if (y + BLOCK_HEIGHT > pageHeight - MARGIN.bottom) {
    doc.addPage();
    drawHeader();
    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text(
      `Page ${doc.internal.getNumberOfPages()}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" },
    );
    y = MARGIN.top + 8;
  }

  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text(NOTE, MARGIN.left, y);
  // Space left blank so both signatories sign above their line.
  const signLine = y + 20;
  doc.text(OFFICE, MARGIN.left, signLine);
  doc.text(recommendedLine(recommendedBy), right, signLine, { align: "right" });
  doc.text(`(Head, ${disciplineCode})`, right, signLine + 5, {
    align: "right",
  });

  // Written last, once the final page count is known.
  const pages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth / 2 - 25, pageHeight - 10, 50, 6, "F");
    doc.setFont("helvetica", "normal").setFontSize(8);
    doc.text(`Page ${page} of ${pages}`, pageWidth / 2, pageHeight - 6, {
      align: "center",
    });
  }

  doc.save(`${fileStem({ disciplineCode, monthName, year })}.pdf`);
}

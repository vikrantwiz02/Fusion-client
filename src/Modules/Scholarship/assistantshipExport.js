// Rebuilds the sheet the office prints: institute block at the top right, the
// ruled table, and signature space above each signatory line. The on-screen
// status columns are deliberately left out — they are a working aid, not part
// of the document.
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

const HEADER_FILL = "FFF2F2F2";
// Naming the font stops a viewer substituting one, which turned PDPM into a
// pi glyph.
const FONT = "Calibri";

const THIN = { style: "thin", color: { argb: "FF000000" } };
const BOX = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const LAST_COL = COLUMNS.length;
const AMOUNT_COL = COLUMNS.findIndex((c) => c.key === "amount") + 1;
const REMARK_COL = COLUMNS.findIndex((c) => c.key === "remark") + 1;

export default async function exportAssistantshipSheet({
  discipline,
  disciplineCode,
  monthName,
  year,
  rows,
  recommendedBy,
}) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${monthName} ${year}`.slice(0, 31));

  sheet.columns = COLUMNS.map(({ key, excelWidth }) => ({
    key,
    width: excelWidth,
  }));

  // Printed landscape on A4 with narrow margins, room at the top for the
  // punch holes, and a page number in the footer.
  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.6,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };
  sheet.headerFooter = { oddFooter: "&CPage &P of &N" };

  const band = (text, { align = "center", bold = false, size = 11 } = {}) => {
    const row = sheet.addRow([text]);
    sheet.mergeCells(row.number, 1, row.number, LAST_COL);
    const cell = row.getCell(1);
    cell.alignment = { horizontal: align, vertical: "middle" };
    cell.font = { name: FONT, bold, size };
    return row;
  };

  // The generated-on date sits in the corner, the institute block to the right.
  const stamp = sheet.addRow([]);
  stamp.getCell(1).value = `Date: ${printedOn()}`;
  stamp.getCell(1).font = { name: FONT, size: 9 };
  sheet.mergeCells(stamp.number, LAST_COL - 3, stamp.number, LAST_COL);
  const brand = stamp.getCell(LAST_COL - 3);
  const [instituteName, ...instituteRest] = INSTITUTE_LINES;
  brand.value = instituteName;
  brand.alignment = { horizontal: "right" };
  brand.font = { name: FONT, bold: true, size: 11 };

  instituteRest.forEach((line) => {
    const row = sheet.addRow([]);
    sheet.mergeCells(row.number, LAST_COL - 3, row.number, LAST_COL);
    const cell = row.getCell(LAST_COL - 3);
    cell.value = line;
    cell.alignment = { horizontal: "right" };
    cell.font = { name: FONT, size: 10 };
  });

  sheet.addRow([]);
  band(`${discipline} Discipline`, { bold: true, size: 12 });
  band(`Assistantship for the Month of ${monthName}, ${year}`);
  sheet.addRow([]);

  const head = sheet.addRow(COLUMNS.map((c) => c.header));
  head.eachCell((cell) => {
    cell.font = { name: FONT, bold: true, size: 10 };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = BOX;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
  });
  head.height = 46;

  rows.forEach((row, index) => {
    const line = sheet.addRow(bodyRow(row, index));
    line.eachCell((cell) => {
      cell.font = { name: FONT, size: 10 };
      cell.border = BOX;
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    line.getCell("amount").numFmt = "0.00";
    line.getCell("amount").alignment = {
      horizontal: "right",
      vertical: "middle",
    };
  });

  const totalRow = sheet.addRow({ amount: totalOf(rows) });
  sheet.mergeCells(totalRow.number, 1, totalRow.number, AMOUNT_COL - 1);
  const totalLabel = totalRow.getCell(1);
  totalLabel.value = "Total";
  totalLabel.alignment = { horizontal: "right", vertical: "middle" };
  totalLabel.font = { name: FONT, bold: true, size: 10 };
  const totalValue = totalRow.getCell(AMOUNT_COL);
  totalValue.font = { name: FONT, bold: true, size: 10 };
  totalValue.numFmt = "0.00";
  totalValue.alignment = { horizontal: "right", vertical: "middle" };
  [1, AMOUNT_COL, REMARK_COL].forEach((col) => {
    totalRow.getCell(col).border = BOX;
  });

  sheet.addRow([]);
  const note = sheet.addRow([]);
  note.getCell(1).value = NOTE;
  note.getCell(1).font = { name: FONT, size: 10 };

  // Blank, tall rows so both signatories have room to sign above their line.
  for (let i = 0; i < 3; i += 1) {
    sheet.addRow([]).height = 18;
  }

  const signedBy = sheet.addRow([]);
  signedBy.getCell(1).value = OFFICE;
  signedBy.getCell(1).font = { name: FONT, size: 10 };
  signedBy.getCell(AMOUNT_COL - 1).value = recommendedLine(recommendedBy);
  signedBy.getCell(AMOUNT_COL - 1).font = { name: FONT, size: 10 };

  const head_of = sheet.addRow([]);
  head_of.getCell(AMOUNT_COL - 1).value = `(Head, ${disciplineCode})`;
  head_of.getCell(AMOUNT_COL - 1).font = { name: FONT, size: 10 };

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileStem({ disciplineCode, monthName, year })}.xlsx`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

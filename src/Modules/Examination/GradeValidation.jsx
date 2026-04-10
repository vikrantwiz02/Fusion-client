import { useState, useEffect } from "react";
import {
  Card,
  Stack,
  Paper,
  Select,
  Button,
  Group,
  Table,
  Text,
  Alert,
  LoadingOverlay,
  Box,
} from "@mantine/core";
import { IconDownload, IconPackage } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { useSelector } from "react-redux";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { grade_validation } from "./routes/examinationRoutes.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmt1 = (n) => (typeof n === "number" ? n.toFixed(1) : "0.0");

// ── HTML builder ─────────────────────────────────────────────────────────────
function buildValidationHTML(studentInfo, semesters) {
  const semesterBlocks = semesters
    .map((sem) => {
      const isReg = sem.is_registered_only === true;
      const headingBg = isReg ? "#fff3cd" : "#dce7f3";

      const rows = sem.courses
        .map(
          (c) => {
            const remarkClass = `remark-${(c.remark || "Regular").toLowerCase()}`;
            return `
        <tr>
          <td class="code">${esc(c.code)}</td>
          <td class="title">${esc(c.name)}</td>
          <td class="center">${esc(c.credits)}</td>
          <td class="center">${esc(c.grade)}</td>
          <td class="center ${remarkClass}">${esc(c.remark || "Regular")}</td>
        </tr>`;
          }
        )
        .join("");

      const summary = isReg
        ? `<td class="sum-cell" colspan="4"><b>Total Registered Credits:</b> ${sem.semester_credits ?? 0}</td>`
        : `<td class="sum-cell"><b>Total Credits Earned:</b> ${sem.total_credits ?? 0}</td>
           <td class="sum-cell"><b>Semester Credits Earned:</b> ${sem.semester_credits ?? 0}</td>
           <td class="sum-cell sum-center"><b>SPI:</b> ${sem.spi != null ? fmt1(sem.spi) : "—"}</td>
           <td class="sum-cell sum-center"><b>CPI:</b> ${sem.cpi != null ? fmt1(sem.cpi) : "—"}</td>`;

      return `
      <div class="sem-block">
        <div class="sem-heading" style="background:${headingBg}">${esc(sem.label)}</div>
        <table class="course-table">
          <thead>
            <tr>
              <th class="code">Course No.</th>
              <th class="title">Course Title</th>
              <th class="center">Units</th>
              <th class="center">Grade</th>
              <th class="center">Remark</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <table class="sum-table"><tr>${summary}</tr></table>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
    padding: 0;
  }

  /* ── HEADER ── */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    border: 1pt solid #000;
  }
  .header-table td {
    padding: 4pt 6pt;
    font-size: 9pt;
    vertical-align: top;
    border: none;
  }
  .header-table .lbl { font-weight: bold; width: 14%; white-space: nowrap; }
  .header-table .val { width: 36%; }
  .header-table tr:first-child td { border-bottom: 1pt solid #000; }

  /* ── SEMESTER BLOCK ── */
  .sem-block { margin-top: 10pt; page-break-inside: avoid; }

  .sem-heading {
    font-size: 9.5pt;
    font-weight: bold;
    padding: 3pt 6pt;
    background: #dce7f3;
    border: 1pt solid #000;
    border-bottom: none;
  }

  .course-table {
    width: 100%;
    border-collapse: collapse;
    border: 1pt solid #000;
    table-layout: fixed;
  }
  thead tr { background: #eef4fb; }
  th, td {
    border-bottom: 0.5pt solid #bbb;
    border-right: 0.5pt solid #bbb;
    padding: 3pt 5pt;
    font-size: 8.5pt;
    vertical-align: middle;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  th { font-weight: bold; text-align: center; font-size: 8.5pt; }
  td:last-child, th:last-child { border-right: none; }
  tbody tr:last-child td { border-bottom: none; }

  /* column widths */
  .code  { width: 13%; }
  .title { width: 48%; text-align: left; }
  .center { width: 13%; text-align: center; }

  /* remark colours */
  .remark-regular     { color: #2f9e44; font-weight: 600; }
  .remark-backlog     { color: #c92a2a; font-weight: 600; }
  .remark-improvement { color: #e67700; font-weight: 600; }

  /* ── SUMMARY ROW ── */
  .sum-table {
    width: 100%;
    border-collapse: collapse;
    border: 1pt solid #000;
    border-top: none;
    background: #f0f4f8;
    table-layout: fixed;
  }
  .sum-cell {
    padding: 5pt 8pt;
    font-size: 8.5pt;
    white-space: nowrap;
    border: none;
    width: 25%;
    vertical-align: middle;
  }
  .sum-center { text-align: center; }
</style>
</head><body>

<!-- HEADER -->
<table class="header-table">
  <tr>
    <td class="lbl">Roll No.</td>
    <td class="val">${esc(studentInfo.roll_no)}</td>
    <td class="lbl">Programme</td>
    <td class="val">${esc(studentInfo.programme)}</td>
  </tr>
  <tr>
    <td class="lbl">Student Name</td>
    <td class="val">${esc(studentInfo.name)}</td>
    <td class="lbl">Discipline</td>
    <td class="val">${esc(studentInfo.discipline)}</td>
  </tr>
</table>

${semesterBlocks}

</body></html>`;
}

// ── PDF core (returns jsPDF instance) ────────────────────────────────────────
async function buildPDF(studentInfo, semesters) {
  const PAGE_W_MM = 210;
  const MARGIN = { top: 8, left: 12, right: 12, bottom: 12 };
  const CONTENT_W_MM = PAGE_W_MM - MARGIN.left - MARGIN.right;
  const CONTENT_W_PX = Math.round(CONTENT_W_MM * (96 / 25.4));   // ≈ 707 px
  const PAGE_H_MM = 297;
  const CONTENT_H_MM = PAGE_H_MM - MARGIN.top - MARGIN.bottom;    // ≈ 277 mm
  const SCALE = 2;

  const html = buildValidationHTML(studentInfo, semesters);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:${CONTENT_W_PX}px;height:10px;border:none;visibility:hidden;`;
  document.body.appendChild(iframe);

  try {
    const iDoc = iframe.contentDocument;
    iDoc.open();
    iDoc.write(html);
    iDoc.close();
    await new Promise((r) => setTimeout(r, 300));
    iDoc.body.style.cssText = `margin:0;padding:0;width:${CONTENT_W_PX}px;background:#fff;`;
    iframe.style.height = iDoc.body.scrollHeight + "px";
    await new Promise((r) => setTimeout(r, 150));

    // ── Measure every .sem-block for smart page breaks ──────────────────────
    // Content height in DOM pixels (no scale yet)
    const CONTENT_H_PX = Math.round(CONTENT_H_MM * (CONTENT_W_PX / CONTENT_W_MM));

    const semBlocks = Array.from(iDoc.querySelectorAll(".sem-block"));
    const blockRects = semBlocks.map((el) => ({
      top: el.offsetTop,
      height: el.offsetHeight,
    }));

    // Build page-start breakpoints (DOM px) so no block is split
    const pageStarts = [0];
    for (const block of blockRects) {
      const pageTop = pageStarts[pageStarts.length - 1];
      // If the block's bottom overflows the current page, move it to a new page
      if (block.top + block.height - pageTop > CONTENT_H_PX) {
        pageStarts.push(block.top);
      }
    }
    pageStarts.push(iDoc.body.scrollHeight); // sentinel end

    // ── Render full body to canvas ───────────────────────────────────────────
    const canvas = await html2canvas(iDoc.body, {
      scale: SCALE,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: CONTENT_W_PX,
      height: iDoc.body.scrollHeight,
      windowWidth: CONTENT_W_PX,
    });

    // ── Slice canvas per page ────────────────────────────────────────────────
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    for (let i = 0; i < pageStarts.length - 1; i++) {
      const startDOM = pageStarts[i];
      const endDOM   = pageStarts[i + 1];
      const sliceH_DOM = endDOM - startDOM;

      // Canvas coords (scaled)
      const srcY    = Math.round(startDOM * SCALE);
      const sliceH_C = Math.round(sliceH_DOM * SCALE);

      const slice = document.createElement("canvas");
      slice.width  = canvas.width;
      slice.height = sliceH_C;
      slice
        .getContext("2d")
        .drawImage(canvas, 0, srcY, canvas.width, sliceH_C, 0, 0, canvas.width, sliceH_C);

      const imgData = slice.toDataURL("image/png");
      const imgH_MM = (sliceH_DOM / CONTENT_W_PX) * CONTENT_W_MM;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", MARGIN.left, MARGIN.top, CONTENT_W_MM, imgH_MM);
    }

    return pdf;
  } finally {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  }
}

// ── Single-student download ───────────────────────────────────────────────────
async function downloadValidationPDF(studentInfo, semesters) {
  const pdf = await buildPDF(studentInfo, semesters);
  const safeName = `${studentInfo.roll_no}_GradeValidation`
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  pdf.save(`${safeName}.pdf`);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function GradeValidation() {
  const userRole = useSelector((state) => state.user.role);
  const token    = localStorage.getItem("authToken");

  const [batches, setBatches]               = useState([]);
  const [batchId, setBatchId]               = useState(null);
  const [students, setStudents]             = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [downloadingRow, setDownloadingRow] = useState(null);
  const [exportingAll, setExportingAll]     = useState(false);
  const [error, setError]                   = useState(null);

  // ── Load dropdown options ────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get(grade_validation, {
        params: { role: userRole },
        headers: { Authorization: `Token ${token}` },
      })
      .then(({ data }) => {
        const sorted = (data.batches || []).slice().sort((a, b) => {
          const yearA = parseInt((a.label || "").match(/(\d{4})/g)?.pop() || 0);
          const yearB = parseInt((b.label || "").match(/(\d{4})/g)?.pop() || 0);
          return yearB - yearA;
        });
        setBatches(sorted.map((b) => ({ value: String(b.id), label: b.label })));
      })
      .catch(() => setError("Failed to load form options."));
  }, [userRole]);

  const fetchAllGrades = async (rollNo) => {
    const { data } = await axios.post(
      grade_validation,
      { Role: userRole, action: "get_all_grades", roll_no: rollNo },
      { headers: { Authorization: `Token ${token}` } }
    );
    return data;
  };

  // ── Generate student list ────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!batchId) { setError("Please select a batch."); return; }
    setError(null);
    setStudents([]);
    setLoadingStudents(true);
    try {
      const { data } = await axios.post(
        grade_validation,
        { Role: userRole, action: "get_students", batch_id: Number(batchId) },
        { headers: { Authorization: `Token ${token}` } }
      );
      setStudents(data.students || []);
      if (!(data.students || []).length)
        setError("No students found for the selected batch.");
    } catch (e) {
      setError(e.response?.data?.error || "Failed to fetch students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  // ── Single download ──────────────────────────────────────────────────────
  const handleDownload = async (rollNo) => {
    setDownloadingRow(rollNo);
    try {
      const data = await fetchAllGrades(rollNo);
      if (!data.semesters?.length) {
        showNotification({ title: "No grades", message: "No grade records found.", color: "yellow" });
        return;
      }
      await downloadValidationPDF(data.student_info, data.semesters);
      showNotification({ title: "Downloaded", message: `${rollNo}_GradeValidation.pdf`, color: "green" });
    } catch (e) {
      showNotification({ title: "Download failed", message: e.response?.data?.error || e.message, color: "red" });
    } finally {
      setDownloadingRow(null);
    }
  };

  // ── Export All as ZIP ────────────────────────────────────────────────────
  // Export All: server-side ZIP via Django/ReportLab — fast, no client rendering
  const handleExportAll = async () => {
    if (!students.length || !batchId) return;
    setExportingAll(true);
    try {
      const resp = await axios.post(
        grade_validation,
        { Role: userRole, action: "export_all_zip", batch_id: Number(batchId) },
        {
          headers: { Authorization: `Token ${token}` },
          responseType: "blob",
        }
      );
      const batchLabel = batches.find((b) => b.value === batchId)?.label || `Batch${batchId}`;
      const zipName =
        `GradeValidation_${batchLabel}`
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_-]/g, "") + ".zip";
      saveAs(new Blob([resp.data]), zipName);
      showNotification({ title: "Export complete", message: zipName, color: "green" });
    } catch (e) {
      showNotification({ title: "Export failed", message: e.response?.data?.detail || e.message, color: "red" });
    } finally {
      setExportingAll(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Stack spacing="md" pos="relative">
        <LoadingOverlay visible={loadingStudents} />

        {error && (
          <Alert color="red" radius="sm" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper shadow="sm" radius="sm" p="md" withBorder>
          <Stack spacing="md">
            <Text size="xl" weight={700}>Grade Validation</Text>
            <Box>
              <Select
                label="Batch"
                placeholder="Select Batch"
                data={batches}
                value={batchId}
                onChange={(v) => { setBatchId(v); setStudents([]); }}
                radius="sm"
                searchable
                style={{ maxWidth: 520 }}
              />
            </Box>
            <Group>
              <Button
                onClick={handleGenerate}
                loading={loadingStudents}
                disabled={!batchId}
                radius="sm"
                size="md"
              >
                Generate Student List
              </Button>
              {students.length > 0 && (
                <Button
                  leftIcon={<IconPackage size={16} />}
                  onClick={handleExportAll}
                  loading={exportingAll}
                  radius="sm"
                  size="md"
                  color="teal"
                  variant="outline"
                >
                  Export All
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>

        {students.length > 0 && (
          <Paper shadow="sm" radius="sm" p="md" withBorder>
            <Text size="sm" color="dimmed" mb="sm">
              {students.length} student{students.length !== 1 ? "s" : ""} found
            </Text>
            <Table striped highlightOnHover fontSize="sm" style={{ border: "1px solid #dee2e6" }}>
              <thead style={{ backgroundColor: "#e7f5ff" }}>
                <tr>
                  <th style={{ padding: "10px 12px" }}>#</th>
                  <th style={{ padding: "10px 12px" }}>Roll Number</th>
                  <th style={{ padding: "10px 12px" }}>Name</th>
                  <th style={{ padding: "10px 12px" }}>Programme</th>
                  <th style={{ padding: "10px 12px" }}>Discipline</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.roll_no}>
                    <td style={{ padding: "8px 12px" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.roll_no}</td>
                    <td style={{ padding: "8px 12px" }}>{s.name}</td>
                    <td style={{ padding: "8px 12px" }}>{s.programme}</td>
                    <td style={{ padding: "8px 12px" }}>{s.discipline || "—"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <Button
                        size="xs"
                        radius="sm"
                        color="blue"
                        variant="filled"
                        leftIcon={<IconDownload size={14} />}
                        loading={downloadingRow === s.roll_no}
                        disabled={exportingAll}
                        onClick={() => handleDownload(s.roll_no)}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </Card>
  );
}

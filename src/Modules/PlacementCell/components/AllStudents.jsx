import React, { useEffect, useState, useMemo } from 'react';
import {
  Stack, Table, Text, Badge, Loader, Alert, Select, ScrollArea,
  Group, NumberInput, Button, Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { updateStudentByOfficer } from '../api';

const TH = {
  padding: '10px 15px',
  backgroundColor: '#C5E2F6',
  color: '#3498db',
  textAlign: 'center',
  borderRight: '1px solid #d3d3d3',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};
const TD = { padding: '8px 15px', textAlign: 'center' };
const rowBg = (i) => ({ backgroundColor: i % 2 !== 0 ? '#E6F7FF' : '#ffffff' });

export default function AllStudents({ fetchBatchesFn, fetchStudentsFn }) {
  const [batches, setBatches]               = useState([]);
  const [batchId, setBatchId]               = useState(null);
  const [batchLabel, setBatchLabel]         = useState('');
  const [students, setStudents]             = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError]                   = useState(null);
  const [minCpi, setMinCpi]                 = useState('');
  const [maxCpi, setMaxCpi]                 = useState('');

  useEffect(() => {
    fetchBatchesFn()
      .then((data) => setBatches(data.map((b) => ({ value: String(b.id), label: b.label }))))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingBatches(false));
  }, []);

  useEffect(() => {
    if (!batchId) { setStudents([]); return; }
    setLoadingStudents(true);
    setError(null);
    setMinCpi('');
    setMaxCpi('');
    fetchStudentsFn(batchId)
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingStudents(false));
  }, [batchId]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const cpi = parseFloat(s.live_cpi);
      if (isNaN(cpi)) return true;
      if (minCpi !== '' && cpi < parseFloat(minCpi)) return false;
      if (maxCpi !== '' && cpi > parseFloat(maxCpi)) return false;
      return true;
    });
  }, [students, minCpi, maxCpi]);

  const placementLabel = (s) => {
    const hasOff = s.off_campus?.length > 0;
    if (s.is_placed && hasOff) return 'Placed';
    if (s.is_placed) return 'On-Campus';
    if (hasOff) return 'Off-Campus';
    return 'Not Placed';
  };

  const placementColor = (s) =>
    (s.is_placed || s.off_campus?.length > 0) ? 'green' : 'gray';

  const handleStatusUpdate = async (roll_no, updates) => {
    try {
      const result = await updateStudentByOfficer({ roll_no, ...updates });
      setStudents((prev) => prev.map((s) =>
        s.roll_no === roll_no ? { ...s, ...result } : s
      ));
      notifications.show({ title: 'Updated', message: 'Student status updated.', color: 'green', autoClose: 2000 });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red', autoClose: 4000 });
    }
  };

  const tableRows = filtered.map((s, i) => [
    i + 1, s.roll_no, s.student_name, s.email, s.live_cpi ?? '—',
    placementLabel(s), s.opted_out ? 'Yes' : 'No',
  ]);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Student Placement List — ${batchLabel}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['S.No.', 'Roll No', 'Name', 'Email', 'CPI (Published)', 'Status', 'Opted Out']],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
    });
    doc.save(`students_${batchLabel.replace(/\s+/g, '_')}.pdf`);
  };

  const exportXLSX = () => {
    const headers = ['S.No.', 'Roll No', 'Name', 'Email', 'CPI (Published)', 'Status', 'Opted Out'];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...tableRows]);
    ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `students_${batchLabel.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <Stack spacing="sm">
      <Select
        placeholder="Select batch…"
        data={batches}
        value={batchId}
        onChange={(v) => {
          setBatchId(v);
          setBatchLabel(batches.find((b) => b.value === v)?.label ?? '');
        }}
        searchable clearable
        disabled={loadingBatches}
        nothingFoundMessage="No batches with published results"
        label="Batch"
        style={{ maxWidth: 340 }}
      />

      {error && <Alert color="red">{error}</Alert>}

      {!batchId && !loadingBatches && (
        <Text color="dimmed" size="sm">Select a batch to view students with published results.</Text>
      )}

      {loadingStudents && <Loader size="sm" />}

      {batchId && !loadingStudents && (
        <>
          <Group align="flex-end" spacing="sm">
            <NumberInput
              label="CPI ≥" placeholder="e.g. 7.0" value={minCpi}
              onChange={(v) => setMinCpi(v === '' ? '' : v)}
              precision={1} min={0} max={10} step={0.1} style={{ width: 110 }}
            />
            <NumberInput
              label="CPI ≤" placeholder="e.g. 10.0" value={maxCpi}
              onChange={(v) => setMaxCpi(v === '' ? '' : v)}
              precision={1} min={0} max={10} step={0.1} style={{ width: 110 }}
            />
            {(minCpi !== '' || maxCpi !== '') && (
              <Button variant="subtle" size="sm" onClick={() => { setMinCpi(''); setMaxCpi(''); }}>
                Clear Filter
              </Button>
            )}
          </Group>

          <Group position="apart">
            <Text size="sm" color="dimmed">
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} with published CPI
              {(minCpi !== '' || maxCpi !== '') && ` (filtered from ${students.length})`}
            </Text>
            {filtered.length > 0 && (
              <Menu shadow="md" width={160}>
                <Menu.Target><Button size="xs" variant="light">Export ▾</Button></Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={exportXLSX}>Download XLSX</Menu.Item>
                  <Menu.Item onClick={exportPDF}>Download PDF</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>

          {filtered.length === 0 ? (
            <Text color="dimmed" size="sm">No students match the current filter.</Text>
          ) : (
            <div style={{ border: '1px solid #d3d3d3', borderRadius: 10, overflow: 'hidden' }}>
              <ScrollArea>
                <Table highlightOnHover>
                  <thead>
                    <tr>
                      {['S.No.', 'Roll No', 'Name', 'Email', 'CPI (Published)', 'Status', 'Opted Out', 'Actions'].map((h) => (
                        <th key={h} style={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.roll_no} style={rowBg(i)}>
                        <td style={TD}>{i + 1}</td>
                        <td style={TD}>{s.roll_no}</td>
                        <td style={TD}>{s.student_name}</td>
                        <td style={TD}>{s.email}</td>
                        <td style={TD}><strong>{s.live_cpi ?? '—'}</strong></td>
                        <td style={TD}>
                          <Badge color={placementColor(s)} variant="light">{placementLabel(s)}</Badge>
                        </td>
                        <td style={TD}>{s.opted_out ? 'Yes' : 'No'}</td>
                        <td style={TD}>
                          <Menu shadow="sm" width={180}>
                            <Menu.Target>
                              <Button size="xs" variant="subtle">Actions ▾</Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                onClick={() => handleStatusUpdate(s.roll_no, { is_placed: !s.is_placed })}
                              >
                                {s.is_placed ? 'Mark Not Placed' : 'Mark Placed (On-Campus)'}
                              </Menu.Item>
                              <Menu.Item
                                disabled={s.opted_out}
                                onClick={() => !s.opted_out && handleStatusUpdate(s.roll_no, { opted_out: true })}
                              >
                                {s.opted_out ? 'Already Opted Out' : 'Set Opted Out'}
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}

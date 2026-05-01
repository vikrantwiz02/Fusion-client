import React, { useEffect, useState } from 'react';
import {
  Stack, Table, Text, Badge, Button, Group, Select, Checkbox,
  Alert, Loader, ScrollArea,
} from '@mantine/core';
import { fetchApplicants, updateAppStatus, bulkUpdateStatus } from '../api';

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

const STATUS_COLOR = {
  applied: 'yellow', shortlisted: 'blue', placed: 'green', rejected: 'red', withdrawn: 'gray',
};
const STATUS_OPTIONS = [
  { value: 'applied',     label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'placed',      label: 'Placed' },
  { value: 'withdrawn',   label: 'Withdrawn' },
];

export default function ApplicantList({ job }) {
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState([]);
  const [bulkStatus, setBulkStatus]   = useState('shortlisted');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    if (!job) return;
    setLoading(true);
    fetchApplicants(job.id)
      .then(setApps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [job]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const updated = await updateAppStatus(appId, newStatus);
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: updated.status } : a));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleBulk = async () => {
    if (selected.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkUpdateStatus(selected, bulkStatus);
      setApps((prev) => prev.map((a) => selected.includes(a.id) ? { ...a, status: bulkStatus } : a));
      setSelected([]);
    } catch (e) {
      alert(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelect = (id) => setSelected((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
  const toggleAll = () =>
    setSelected(selected.length === apps.length ? [] : apps.map((a) => a.id));

  if (!job)    return <Text color="dimmed">Select a job post to view applicants.</Text>;
  if (loading) return <Loader />;
  if (error)   return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <Stack spacing="sm">
      <Text weight={600}>{job.company_name} — {job.role} ({apps.length} applicant{apps.length !== 1 ? 's' : ''})</Text>

      {selected.length > 0 && (
        <Group>
          <Text size="sm">{selected.length} selected</Text>
          <Select size="sm" data={STATUS_OPTIONS} value={bulkStatus} onChange={setBulkStatus} style={{ width: 160 }} />
          <Button size="sm" loading={bulkLoading} onClick={handleBulk}>Update Selected</Button>
        </Group>
      )}

      <div style={{ border: '1px solid #d3d3d3', borderRadius: 10, overflow: 'hidden' }}>
        <ScrollArea>
          <Table highlightOnHover>
            <thead>
              <tr>
                <th style={TH}>
                  <Checkbox
                    checked={selected.length === apps.length && apps.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                {['Roll No', 'Name', 'Email', 'CPI', 'Status', 'Applied'].map((h) => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map((a, i) => (
                <tr key={a.id} style={rowBg(i)}>
                  <td style={TD}>
                    <Checkbox checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} />
                  </td>
                  <td style={TD}>{a.roll_no}</td>
                  <td style={TD}>{a.student_name}</td>
                  <td style={TD}>{a.email}</td>
                  <td style={TD}><strong>{a.live_cpi ?? '—'}</strong></td>
                  <td style={TD}>
                    <Select
                      size="xs"
                      data={STATUS_OPTIONS}
                      value={a.status}
                      onChange={(v) => handleStatusChange(a.id, v)}
                      style={{ width: 130 }}
                    />
                  </td>
                  <td style={TD}>{new Date(a.applied_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ScrollArea>
      </div>
    </Stack>
  );
}

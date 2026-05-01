import React, { useEffect, useState } from 'react';
import {
  Stack, Table, Text, Button, TextInput, Textarea, Modal, Group,
  Alert, Loader, Select, Badge, ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { fetchOffCampus, addOffCampus, deleteOffCampus } from '../api';

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

const TYPE_OPTIONS = [
  { value: 'placement',  label: 'Placement' },
  { value: 'internship', label: 'Internship' },
];

const EMPTY = {
  roll_no: '', company_name: '', role: '', offer_type: 'placement',
  ctc: '', stipend: '', offer_date: '', notes: '',
};

export default function OffCampusManager() {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const reload = () => {
    setLoading(true);
    fetchOffCampus()
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const handleAdd = async () => {
    if (!form.roll_no.trim() || !form.company_name.trim() || !form.role.trim() || !form.offer_date) {
      notifications.show({ title: 'Validation', message: 'Roll No, Company, Role and Offer Date are required.', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const toDecimal = (v) => (v === '' || v === null || v === undefined) ? null : v;
      await addOffCampus({
        ...form,
        ctc:     toDecimal(form.ctc),
        stipend: toDecimal(form.stipend),
      });
      setModal(false);
      setForm(EMPTY);
      reload();
      notifications.show({ title: 'Added', message: 'Off-campus placement recorded.', color: 'green', autoClose: 3000 });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red', autoClose: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this off-campus placement record?')) return;
    try {
      await deleteOffCampus(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      notifications.show({ title: 'Deleted', message: 'Record removed.', color: 'orange', autoClose: 3000 });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message, color: 'red', autoClose: 5000 });
    }
  };

  if (loading) return <Loader />;
  if (error)   return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <>
      <Stack spacing="sm">
        <Group justify="space-between">
          <Text weight={600} size="lg">Off-Campus Placements</Text>
          <Button size="sm" onClick={() => { setForm(EMPTY); setModal(true); }}>+ Add Record</Button>
        </Group>

        {records.length === 0 ? (
          <Text color="dimmed" size="sm">No off-campus placement records yet.</Text>
        ) : (
          <div style={{ border: '1px solid #d3d3d3', borderRadius: 10, overflow: 'hidden' }}>
            <ScrollArea>
              <Table highlightOnHover>
                <thead>
                  <tr>
                    {['S.No.', 'Roll No', 'Name', 'Company', 'Role', 'Type', 'CTC / Stipend', 'Offer Date', 'Notes', 'Action'].map((h) => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={rowBg(i)}>
                      <td style={TD}>{i + 1}</td>
                      <td style={TD}>{r.roll_no}</td>
                      <td style={TD}>{r.student_name}</td>
                      <td style={TD}>{r.company_name}</td>
                      <td style={TD}>{r.role}</td>
                      <td style={TD}>
                        <Badge color={r.offer_type === 'placement' ? 'blue' : 'grape'} variant="light">
                          {r.offer_type === 'placement' ? 'Placement' : 'Internship'}
                        </Badge>
                      </td>
                      <td style={TD}>
                        {r.ctc ? `${r.ctc} LPA` : r.stipend ? `₹${r.stipend}/mo` : '—'}
                      </td>
                      <td style={TD}>{r.offer_date}</td>
                      <td style={TD}><Text size="xs" lineClamp={2}>{r.notes || '—'}</Text></td>
                      <td style={TD}>
                        <Button size="xs" color="red" variant="light" onClick={() => handleDelete(r.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </Stack>

      <Modal opened={modal} onClose={() => setModal(false)} title="Add Off-Campus Placement" size="md">
        <Stack spacing="sm">
          <TextInput
            label="Student Roll No" required placeholder="e.g. 21BCS001"
            value={form.roll_no}
            onChange={(e) => setForm((f) => ({ ...f, roll_no: e.currentTarget.value }))}
          />
          <TextInput
            label="Company Name" required value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.currentTarget.value }))}
          />
          <TextInput
            label="Role" required value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.currentTarget.value }))}
          />
          <Select
            label="Offer Type"
            data={TYPE_OPTIONS}
            value={form.offer_type}
            onChange={(v) => setForm((f) => ({ ...f, offer_type: v }))}
          />
          <Group grow>
            <TextInput
              label="CTC (LPA) — optional" placeholder="e.g. 12.5" value={form.ctc}
              onChange={(e) => setForm((f) => ({ ...f, ctc: e.currentTarget.value }))}
            />
            <TextInput
              label="Stipend (₹/mo) — optional" placeholder="e.g. 25000" value={form.stipend}
              onChange={(e) => setForm((f) => ({ ...f, stipend: e.currentTarget.value }))}
            />
          </Group>
          <TextInput
            label="Offer Date" required type="date" value={form.offer_date}
            onChange={(e) => setForm((f) => ({ ...f, offer_date: e.currentTarget.value }))}
          />
          <Textarea
            label="Notes" value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.currentTarget.value }))}
          />
          <Button onClick={handleAdd} loading={saving}>Add Record</Button>
        </Stack>
      </Modal>
    </>
  );
}

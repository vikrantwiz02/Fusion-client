import React, { useEffect, useState } from 'react';
import {
  Stack, Table, Text, Button, TextInput, Textarea, Modal, Group,
  Alert, Loader, Select, MultiSelect, NumberInput, Badge, ScrollArea,
} from '@mantine/core';
import { fetchAllJobs, createJobPost, updateJobPost, toggleJobPost, fetchCompanies, fetchBatches } from '../api';
import ApplicantList from './ApplicantList';

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
  { value: 'ppo',        label: 'Pre Placement Offer' },
];
const TYPE_COLOR = { placement: 'blue', internship: 'grape', ppo: 'teal' };

const EMPTY = {
  company: '', role: '', job_type: 'placement', description: '',
  ctc: '', stipend: '', location: '', min_cpi: 0,
  deadline: '', eligible_batches: [], eligible_programmes: [], eligible_disciplines: [],
  apply_link: '',
};

export default function JobPostManager() {
  const [jobs, setJobs]           = useState([]);
  const [companies, setCompanies] = useState([]);
  const [batches, setBatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [appJob, setAppJob]       = useState(null);
  const [appModal, setAppModal]   = useState(false);

  const reload = () => {
    Promise.all([fetchAllJobs(), fetchCompanies(), fetchBatches()])
      .then(([j, c, b]) => {
        setJobs(j);
        setCompanies(c);
        setBatches(b.map((bt) => ({ value: bt.label, label: bt.label })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const companyOptions = companies.map((c) => ({ value: String(c.id), label: c.name }));

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (j) => {
    setEditing(j);
    setForm({
      company:              String(j.company?.id || j.company_id || ''),
      role:                 j.role,
      job_type:             j.job_type,
      description:          j.description || '',
      ctc:                  j.ctc || '',
      stipend:              j.stipend || '',
      location:             j.location || '',
      min_cpi:              parseFloat(j.min_cpi) || 0,
      deadline:             j.deadline ? j.deadline.slice(0, 16) : '',
      eligible_batches:     j.eligible_batches || [],
      eligible_programmes:  j.eligible_programmes || [],
      eligible_disciplines: j.eligible_disciplines || [],
      apply_link:           j.apply_link || '',
    });
    setModal(true);
  };

  const openApplicants = (j) => { setAppJob(j); setAppModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toDecimal = (v) => (v === '' || v === null || v === undefined) ? null : v;
      const payload = {
        ...form,
        company: parseInt(form.company, 10),
        ctc:     toDecimal(form.ctc),
        stipend: toDecimal(form.stipend),
        min_cpi: form.min_cpi ?? 0,
      };
      if (editing) await updateJobPost(editing.id, payload);
      else         await createJobPost(payload);
      setModal(false);
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await toggleJobPost(id);
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, is_active: updated.is_active } : j));
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <Loader />;
  if (error)   return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <>
      <Stack spacing="sm">
        <Group justify="space-between">
          <Text weight={600} size="lg">Job Posts</Text>
          <Button size="sm" onClick={openCreate}>+ Create Job Post</Button>
        </Group>

        <div style={{ border: '1px solid #d3d3d3', borderRadius: 10, overflow: 'hidden' }}>
          <ScrollArea>
            <Table highlightOnHover>
              <thead>
                <tr>
                  {['Company', 'Role', 'Type', 'Eligible Batches', 'CTC / Stipend', 'Min CPI', 'Deadline', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={j.id} style={rowBg(i)}>
                    <td style={TD}>{j.company_name || j.company?.name}</td>
                    <td style={TD}>{j.role}</td>
                    <td style={TD}>
                      <Badge color={TYPE_COLOR[j.job_type] || 'blue'} variant="light">
                        {TYPE_OPTIONS.find((t) => t.value === j.job_type)?.label || j.job_type}
                      </Badge>
                    </td>
                    <td style={TD}>
                      {j.eligible_batches?.length
                        ? j.eligible_batches.slice(0, 2).join(', ') + (j.eligible_batches.length > 2 ? ` +${j.eligible_batches.length - 2}` : '')
                        : <Text size="xs" color="dimmed">All</Text>}
                    </td>
                    <td style={TD}>{j.ctc ? `${j.ctc} LPA` : j.stipend ? `₹${j.stipend}/mo` : '—'}</td>
                    <td style={TD}>{parseFloat(j.min_cpi) > 0 ? j.min_cpi : '—'}</td>
                    <td style={TD}>{new Date(j.deadline).toLocaleDateString()}</td>
                    <td style={TD}>
                      <Badge color={j.is_active ? 'green' : 'gray'}>{j.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td style={TD}>
                      <Group gap="xs" wrap="nowrap" justify="center">
                        <Button size="xs" variant="light" onClick={() => openEdit(j)}>Edit</Button>
                        <Button size="xs" variant="light" color={j.is_active ? 'orange' : 'green'} onClick={() => handleToggle(j.id)}>
                          {j.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => openApplicants(j)}>Applicants</Button>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        </div>
      </Stack>

      {/* Create / Edit modal */}
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Job Post' : 'Create Job Post'} size="lg">
        <Stack spacing="sm">
          <Select
            label="Company" required
            data={companyOptions}
            value={form.company}
            onChange={(v) => setForm((f) => ({ ...f, company: v }))}
            searchable
          />
          <TextInput
            label="Role" required
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.currentTarget.value }))}
          />
          <Select
            label="Type"
            data={TYPE_OPTIONS}
            value={form.job_type}
            onChange={(v) => setForm((f) => ({ ...f, job_type: v }))}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
          />
          <Group grow>
            <TextInput
              label="CTC (LPA) — optional" placeholder="e.g. 12.5"
              value={form.ctc}
              onChange={(e) => setForm((f) => ({ ...f, ctc: e.currentTarget.value }))}
            />
            <TextInput
              label="Stipend (₹/mo) — optional" placeholder="e.g. 25000"
              value={form.stipend}
              onChange={(e) => setForm((f) => ({ ...f, stipend: e.currentTarget.value }))}
            />
          </Group>
          <TextInput
            label="Location"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.currentTarget.value }))}
          />
          <NumberInput
            label="Minimum CPI"
            value={form.min_cpi}
            onChange={(v) => setForm((f) => ({ ...f, min_cpi: v }))}
            precision={1} min={0} max={10} step={0.1}
          />
          <MultiSelect
            label="Eligible Batches"
            placeholder="All batches if empty"
            data={batches}
            value={form.eligible_batches}
            onChange={(v) => setForm((f) => ({ ...f, eligible_batches: v }))}
            searchable clearable
          />
          <TextInput
            label="External Apply Link — optional"
            placeholder="https://company.com/careers/..."
            description="If students apply via an external portal, paste the link here. Clicking it will still track their application."
            value={form.apply_link}
            onChange={(e) => setForm((f) => ({ ...f, apply_link: e.currentTarget.value }))}
          />
          <TextInput
            label="Deadline (date & time)"
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.currentTarget.value }))}
          />
          <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
        </Stack>
      </Modal>

      {/* Applicants modal */}
      <Modal
        opened={appModal}
        onClose={() => setAppModal(false)}
        title={appJob ? `Applicants — ${appJob.company_name || appJob.company?.name} · ${appJob.role}` : 'Applicants'}
        size="90%"
      >
        {appJob && <ApplicantList job={appJob} />}
      </Modal>
    </>
  );
}

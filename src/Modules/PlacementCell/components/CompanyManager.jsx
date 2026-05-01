import React, { useEffect, useState } from 'react';
import {
  Stack, Table, Text, Button, TextInput, Textarea, Modal,
  Group, Alert, Loader, ScrollArea,
} from '@mantine/core';
import { fetchCompanies, createCompany, updateCompany, deleteCompany } from '../api';

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

const EMPTY = { name: '', sector: '', website: '', description: '' };

export default function CompanyManager() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  const reload = () => {
    setLoading(true);
    fetchCompanies()
      .then(setCompanies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (c) => {
    setEditing(c);
    setForm({ name: c.name, sector: c.sector, website: c.website, description: c.description });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateCompany(editing.id, form);
      else         await createCompany(form);
      setModal(false);
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      await deleteCompany(id);
      reload();
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
          <Text weight={600} size="lg">Companies</Text>
          <Button size="sm" onClick={openCreate}>+ Add Company</Button>
        </Group>

        <div style={{ border: '1px solid #d3d3d3', borderRadius: 10, overflow: 'hidden' }}>
          <ScrollArea>
            <Table highlightOnHover>
              <thead>
                <tr>
                  {['S.No.', 'Name', 'Sector', 'Website', 'Actions'].map((h) => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={c.id} style={rowBg(i)}>
                    <td style={TD}>{i + 1}</td>
                    <td style={TD}>{c.name}</td>
                    <td style={TD}>{c.sector || '—'}</td>
                    <td style={TD}>
                      {c.website
                        ? <a href={c.website} target="_blank" rel="noreferrer" style={{ color: '#3498db' }}>{c.website}</a>
                        : '—'}
                    </td>
                    <td style={TD}>
                      <Group spacing="xs" justify="center">
                        <Button size="xs" variant="light" onClick={() => openEdit(c)}>Edit</Button>
                        <Button size="xs" variant="light" color="red" onClick={() => handleDelete(c.id)}>Delete</Button>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        </div>
      </Stack>

      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Company' : 'Add Company'}>
        <Stack spacing="sm">
          <TextInput label="Company Name" required value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))} />
          <TextInput label="Sector" value={form.sector}
            onChange={(e) => setForm((f) => ({ ...f, sector: e.currentTarget.value }))} />
          <TextInput label="Website" value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.currentTarget.value }))} />
          <Textarea label="Description" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))} />
          <Button onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
        </Stack>
      </Modal>
    </>
  );
}

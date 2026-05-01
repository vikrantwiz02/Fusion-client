import React, { useEffect, useState } from 'react';
import {
  Stack, Card, Text, Button, TextInput, Textarea, Switch, Group,
  Modal, Alert, Loader, Badge,
} from '@mantine/core';
import { fetchOfficerAnnouncements, createAnnouncement, deleteAnnouncement } from '../api';

export default function AnnouncementManager() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState({ title: '', body: '', is_pinned: false });
  const [saving, setSaving]   = useState(false);

  const reload = () => {
    setLoading(true);
    fetchOfficerAnnouncements()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(reload, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createAnnouncement(form);
      setModal(false);
      setForm({ title: '', body: '', is_pinned: false });
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
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
          <Text weight={600} size="lg">Announcements</Text>
          <Button size="sm" onClick={() => setModal(true)}>+ Post Announcement</Button>
        </Group>
        {items.length === 0 && <Text color="dimmed">No announcements yet.</Text>}
        {items.map((a) => (
          <Card key={a.id} withBorder radius="md" p="md"
            style={{ borderLeft: a.is_pinned ? '4px solid #228be6' : '4px solid #dee2e6' }}>
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Group spacing="xs">
                  <Text weight={700}>{a.title}</Text>
                  {a.is_pinned && <Badge color="blue" size="xs">Pinned</Badge>}
                </Group>
                <Text size="sm" mt={4}>{a.body}</Text>
                <Text size="xs" color="dimmed" mt={4}>
                  {a.posted_by_name} · {new Date(a.posted_at).toLocaleDateString()}
                </Text>
              </div>
              <Button size="xs" variant="light" color="red" onClick={() => handleDelete(a.id)}>Delete</Button>
            </Group>
          </Card>
        ))}
      </Stack>

      <Modal opened={modal} onClose={() => setModal(false)} title="New Announcement">
        <Stack spacing="sm">
          <TextInput label="Title" required value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.currentTarget.value }))} />
          <Textarea label="Body" required minRows={3} value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.currentTarget.value }))} />
          <Switch
            label="Pin this announcement"
            checked={form.is_pinned}
            onChange={(e) => { const v = e.currentTarget.checked; setForm((f) => ({ ...f, is_pinned: v })); }}
          />
          <Button onClick={handleCreate} loading={saving}>Post</Button>
        </Stack>
      </Modal>
    </>
  );
}

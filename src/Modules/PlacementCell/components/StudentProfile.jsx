import React, { useEffect, useState } from 'react';
import {
  Stack, TextInput, Switch, Button, Badge, Group, Text, Loader, Alert, Card,
} from '@mantine/core';
import { fetchStudentProfile, updateStudentProfile } from '../api';

export default function StudentProfile() {
  const [profile, setProfile]   = useState(null);
  const [form, setForm]         = useState({ resume_url: '', linkedin_url: '', github_url: '', opted_out: false });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    fetchStudentProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          resume_url:   data.resume_url   || '',
          linkedin_url: data.linkedin_url || '',
          github_url:   data.github_url   || '',
          opted_out:    data.opted_out    || false,
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await updateStudentProfile(form);
      setProfile(updated);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile && !error) return <Loader />;
  if (error && !profile)  return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <Stack spacing="md" style={{ maxWidth: 520 }}>
      <Card withBorder radius="md" p="md">
        <Group position="apart">
          <Text weight={600}>Placement Status</Text>
          <Badge color={profile?.is_placed ? 'green' : 'gray'}>
            {profile?.is_placed ? 'Placed' : 'Not Placed'}
          </Badge>
        </Group>
        {profile?.live_cpi != null && (
          <Text size="sm" color="dimmed" mt={4}>Published CPI: {profile.live_cpi}</Text>
        )}
      </Card>

      <TextInput
        label="Resume (Google Drive link)"
        placeholder="https://drive.google.com/..."
        value={form.resume_url}
        onChange={(e) => setForm((f) => ({ ...f, resume_url: e.currentTarget.value }))}
      />
      <TextInput
        label="LinkedIn URL"
        placeholder="https://linkedin.com/in/..."
        value={form.linkedin_url}
        onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.currentTarget.value }))}
      />
      <TextInput
        label="GitHub URL"
        placeholder="https://github.com/..."
        value={form.github_url}
        onChange={(e) => setForm((f) => ({ ...f, github_url: e.currentTarget.value }))}
      />
      {profile?.opted_out ? (
        <Alert color="orange" title="Opted Out of Placement">
          You have opted out of the placement process. To revert this, please visit the Placement Cell office in person.
        </Alert>
      ) : (
        <Switch
          label="Opt out of placement process"
          description="This action is permanent — you cannot undo it through this portal."
          checked={form.opted_out}
          onChange={(e) => { const v = e.currentTarget.checked; setForm((f) => ({ ...f, opted_out: v })); }}
        />
      )}
      {error && <Alert color="red">{error}</Alert>}
      {saved && <Alert color="green">Profile saved.</Alert>}
      <Button onClick={handleSave} loading={saving}>Save Profile</Button>
    </Stack>
  );
}

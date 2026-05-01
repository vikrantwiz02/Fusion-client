import React, { useEffect, useState } from 'react';
import { Stack, Text, Badge, Card, Group, Button, Loader, Alert } from '@mantine/core';
import { fetchApplications, withdrawApplication } from '../api';

const STATUS_COLOR = {
  applied: 'yellow', shortlisted: 'blue', placed: 'green', rejected: 'red', withdrawn: 'gray',
};

export default function MyApplications() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetchApplications()
      .then(setApps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleWithdraw = async (id) => {
    try {
      await withdrawApplication(id);
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status: 'withdrawn' } : a));
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <Loader />;
  if (error)   return <Alert color="red" title="Error">{error}</Alert>;
  if (apps.length === 0) return <Text color="dimmed">You have not applied to any positions yet.</Text>;

  return (
    <Stack spacing="sm">
      {apps.map((app) => (
        <Card key={app.id} withBorder radius="md" p="md">
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text weight={700}>{app.company_name}</Text>
              <Text size="sm">{app.role}</Text>
              <Text size="xs" color="dimmed">Applied: {new Date(app.applied_at).toLocaleDateString()}</Text>
            </div>
            <Group spacing="xs">
              <Badge color={STATUS_COLOR[app.status] || 'gray'}>{app.status}</Badge>
              {app.status === 'applied' && (
                <Button size="xs" variant="light" color="red" onClick={() => handleWithdraw(app.id)}>
                  Withdraw
                </Button>
              )}
            </Group>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

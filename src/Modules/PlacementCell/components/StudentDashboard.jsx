import React, { useEffect, useState } from 'react';
import {
  Card, Text, Badge, Group, Stack, Loader, Alert, SimpleGrid, Divider,
} from '@mantine/core';
import { fetchDashboard } from '../api';
import JobCard from './JobCard';

export default function StudentDashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error)  return <Alert color="red" title="Error">{error}</Alert>;
  if (!data)  return <Loader />;

  return (
    <Stack spacing="md">
      <Card withBorder radius="md" p="md">
        <Group position="apart">
          <Text weight={600} size="lg">My Placement Status</Text>
          {data.live_cpi != null ? (
            <Badge color="blue" size="lg">CPI: {data.live_cpi}</Badge>
          ) : (
            <Badge color="gray" size="lg">CPI: Not published yet</Badge>
          )}
        </Group>
      </Card>

      {data.announcements?.length > 0 && (
        <>
          <Text weight={600} size="md">Announcements</Text>
          <Stack spacing="xs">
            {data.announcements.map((a) => (
              <Card key={a.id} withBorder radius="sm" p="sm" style={{ borderLeftColor: a.is_pinned ? '#228be6' : undefined, borderLeftWidth: a.is_pinned ? 3 : undefined }}>
                <Text weight={600}>{a.title}</Text>
                <Text size="sm" color="dimmed">{a.body}</Text>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Text weight={600} size="md">Upcoming Drives</Text>
      {data.jobs?.length === 0 ? (
        <Text color="dimmed">No active job openings at this time.</Text>
      ) : (
        <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 768, cols: 1 }]}>
          {data.jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </SimpleGrid>
      )}

      {data.applications?.length > 0 && (
        <>
          <Divider />
          <Text weight={600} size="md">Recent Applications</Text>
          <Stack spacing="xs">
            {data.applications.map((app) => (
              <Card key={app.id} withBorder radius="sm" p="sm">
                <Group position="apart">
                  <div>
                    <Text weight={600}>{app.company_name}</Text>
                    <Text size="sm" color="dimmed">{app.role}</Text>
                  </div>
                  <Badge color={
                    app.status === 'placed' ? 'green' :
                    app.status === 'shortlisted' ? 'blue' :
                    app.status === 'rejected' ? 'red' :
                    app.status === 'withdrawn' ? 'gray' : 'yellow'
                  }>
                    {app.status}
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
}

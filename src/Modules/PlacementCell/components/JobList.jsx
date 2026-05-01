import React, { useEffect, useState } from 'react';
import { Stack, Text, Loader, Alert, TextInput, SimpleGrid } from '@mantine/core';
import { fetchActiveJobs } from '../api';
import JobCard from './JobCard';

export default function JobList() {
  const [jobs, setJobs]   = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetchActiveJobs()
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((j) => {
    const q = query.toLowerCase();
    return (
      j.company_name.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      j.job_type.toLowerCase().includes(q)
    );
  });

  if (loading) return <Loader />;
  if (error)   return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <Stack spacing="md">
      <TextInput
        placeholder="Search by company, role…"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      {filtered.length === 0 ? (
        <Text color="dimmed">No job openings match your search.</Text>
      ) : (
        <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 768, cols: 1 }]}>
          {filtered.map((job) => <JobCard key={job.id} job={job} />)}
        </SimpleGrid>
      )}
    </Stack>
  );
}

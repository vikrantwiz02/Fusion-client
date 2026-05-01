import React, { useEffect, useState } from 'react';
import {
  Stack, Text, Card, SimpleGrid, Group, Loader, Alert, RingProgress,
  Center, Select, Badge,
} from '@mantine/core';

export default function PlacementStatistics({ fetchFn, fetchBatchesFn }) {
  const [batches, setBatches]         = useState([]);
  const [batchId, setBatchId]         = useState(null);
  const [stats, setStats]             = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!fetchBatchesFn) { setLoadingBatches(false); return; }
    fetchBatchesFn()
      .then((data) => setBatches(data.map((b) => ({ value: String(b.id), label: b.label }))))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingBatches(false));
  }, []);

  useEffect(() => {
    if (!batchId) { setStats(null); return; }
    setLoading(true);
    setError(null);
    fetchFn(batchId)
      .then((data) => setStats(Array.isArray(data) ? data[0] : data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [batchId]);

  return (
    <Stack spacing="sm">
      {fetchBatchesFn && (
        <Select
          label="Batch"
          placeholder="Select batch…"
          data={batches}
          value={batchId}
          onChange={setBatchId}
          searchable
          disabled={loadingBatches}
          nothingFoundMessage="No batches with published results"
          style={{ maxWidth: 340 }}
        />
      )}

      {error && <Alert color="red" title="Error">{error}</Alert>}

      {!batchId && !loading && (
        <Text color="dimmed" size="sm">Select a batch to view placement statistics.</Text>
      )}

      {loading && <Loader />}

      {stats && !loading && (
        <Card withBorder radius="md" p="md">
          <Text weight={700} size="lg" mb="md">
            {stats.batch_label || `Batch ${stats.batch_year}`}
          </Text>
          <SimpleGrid cols={4} spacing="md" breakpoints={[{ maxWidth: 768, cols: 2 }]}>
            <Card withBorder radius="sm" p="sm" style={{ textAlign: 'center' }}>
              <Center>
                <RingProgress
                  size={80}
                  thickness={8}
                  sections={[{ value: stats.placement_rate || 0, color: 'green' }]}
                  label={<Text size="xs" align="center">{stats.placement_rate || 0}%</Text>}
                />
              </Center>
              <Text size="sm" align="center" mt={4}>Placed</Text>
              <Text size="xs" color="dimmed" align="center">{stats.total_placed}/{stats.total_students}</Text>
            </Card>
            <Card withBorder radius="sm" p="sm" style={{ textAlign: 'center' }}>
              <Text size="xl" weight={700}>{stats.total_companies}</Text>
              <Text size="sm" color="dimmed">Companies</Text>
            </Card>
            <Card withBorder radius="sm" p="sm" style={{ textAlign: 'center' }}>
              <Text size="xl" weight={700}>{stats.avg_ctc ? `${stats.avg_ctc} LPA` : '—'}</Text>
              <Text size="sm" color="dimmed">Avg CTC</Text>
            </Card>
            <Card withBorder radius="sm" p="sm" style={{ textAlign: 'center' }}>
              <Text size="xl" weight={700}>{stats.highest_ctc ? `${stats.highest_ctc} LPA` : '—'}</Text>
              <Text size="sm" color="dimmed">Highest CTC</Text>
            </Card>
          </SimpleGrid>

          {(stats.on_campus_placed !== undefined) && (
            <Group spacing="xs" mt="md">
              <Badge color="blue" variant="light">On-Campus: {stats.on_campus_placed}</Badge>
              <Badge color="orange" variant="light">Off-Campus: {stats.off_campus_placed}</Badge>
              <Badge color="green" variant="light">Total Placed: {stats.total_placed}</Badge>
            </Group>
          )}
        </Card>
      )}
    </Stack>
  );
}

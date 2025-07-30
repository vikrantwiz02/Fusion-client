import React, { useEffect, useState, useCallback } from 'react';
import {
  Title, Select, Group, Button,
  Table, Text, Loader, Alert,
  Card, Box, Stack
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import axios from 'axios';

import {
  adminListRequestsRoute,
  allotReplacementCoursesRoute,
} from '../../routes/academicRoutes';

const SEMESTER_CHOICES = [
  { value: 'Odd Semester', label: 'Odd Semester' },
  { value: 'Even Semester', label: 'Even Semester' },
  { value: 'Summer Semester', label: 'Summer Semester' },
];

export default function AdminReplacementDashboard() {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allocating, setAllocating] = useState(false);

  const fetchRequests = useCallback(() => {
    if (!year || !semester) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('No auth token found');
      return;
    }

    setLoading(true);
    setError(null);

    axios.get(adminListRequestsRoute, {
      params: { academic_year: year, semester_type: semester },
      headers: { Authorization: `Token ${token}` },
    })
    .then(({ data }) => setRequests(data))
    .catch(err => setError(err.response?.data?.detail || err.message))
    .finally(() => setLoading(false));
  }, [year, semester]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAllocate = () => {
    if (!year || !semester) {
      showNotification({
        title: 'Missing filters',
        message: 'Please select both year and semester.',
        color: 'yellow',
      });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showNotification({ title: 'Auth Error', message: 'No token found', color: 'red' });
      return;
    }

    setAllocating(true);
    axios.post(allotReplacementCoursesRoute,
      { academic_year: year, semester_type: semester },
      { headers: { Authorization: `Token ${token}` } }
    )
    .then(() => {
      showNotification({
        title: 'Allocation Complete',
        message: 'All pending requests processed.',
        color: 'green'
      });
      fetchRequests(); // Refresh after allocation
    })
    .catch(err => {
      showNotification({
        title: 'Allocation Error',
        message: err.response?.data?.detail || err.message,
        color: 'red',
      });
    })
    .finally(() => setAllocating(false));
  };

  return (
    <>
      <Card>
        <Stack spacing="md">
          <Group grow align="flex-start">
            <Select
              label="Academic Year"
              placeholder="e.g. 2024-25"
              data={['2021-22', '2022-23', '2023-24', '2024-25','2025-26','2026-27'].map(y => ({ value: y, label: y }))}
              value={year}
              onChange={setYear}
            />
            <Select
              label="Semester Type"
              placeholder="Select one"
              data={SEMESTER_CHOICES}
              value={semester}
              onChange={setSemester}
            />
          </Group>

          <Group position="left" spacing="xs">
            <Button size="sm" onClick={fetchRequests} loading={loading}>
              Refresh
            </Button>
            <Button size="sm" color="green" onClick={handleAllocate} loading={allocating}>
              Start Allotment
            </Button>
          </Group>
        </Stack>
      </Card>

      {loading ? (
        <Loader />
      ) : error ? (
        <Alert title="Error" color="red">{error}</Alert>
      ) : (!year || !semester) ? (
        <Text color="dimmed">Select year & semester to view requests.</Text>
      ) : (
        <Table highlightOnHover withBorder>
          <thead>
            <tr>
              <th>Student</th>
              <th>Slot</th>
              <th>Old</th>
              <th>New</th>
              <th>Status</th>
              <th>Requested At</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>{r.student}</td>
                <td>{r.slot}</td>
                <td>{r.old_course}</td>
                <td>{r.new_course}</td>
                <td>{r.status}</td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

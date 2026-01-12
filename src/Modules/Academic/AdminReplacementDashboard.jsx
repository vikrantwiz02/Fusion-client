import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Title, Select, Group, Button,
  Table, Text, Loader, Alert,
  Card, Box, Stack, Tabs, Badge
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconFileDownload } from '@tabler/icons-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

import {
  adminListRequestsRoute,
  allotReplacementCoursesRoute,
} from '../../routes/academicRoutes';

const SEMESTER_CHOICES = [
  { value: 'Odd Semester', label: 'Odd Semester' },
  { value: 'Even Semester', label: 'Even Semester' },
  { value: 'Summer Semester', label: 'Summer Semester' },
];

const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];

  years.push(`${currentYear}-${String(currentYear + 1).slice(-2)}`);
  years.push(`${currentYear - 1}-${String(currentYear).slice(-2)}`);

  for (let i = 2; i <= 6; i++) {
    const startYear = currentYear - i;
    const endYear = startYear + 1;
    years.push(`${startYear}-${String(endYear).slice(-2)}`);
  }
  
  return years;
};

export default function AdminReplacementDashboard() {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allocating, setAllocating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const academicYears = generateAcademicYears();

  const pendingRequests = useMemo(
    () => requests.filter(r => r.status === 'Pending'),
    [requests]
  );

  const processedRequests = useMemo(
    () => requests.filter(r => r.status !== 'Pending'),
    [requests]
  );

  const filteredProcessedRequests = useMemo(
    () => statusFilter ? processedRequests.filter(r => r.status === statusFilter) : processedRequests,
    [processedRequests, statusFilter]
  );

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
    .then(({ data }) => setRequests(Array.isArray(data) ? data : []))
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

    if (pendingRequests.length === 0) {
      showNotification({
        title: 'No Pending Requests',
        message: 'There are no pending requests to allocate.',
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

  const handleExportToExcel = useCallback((data, type) => {
    if (data.length === 0) {
      showNotification({
        title: 'No Data',
        message: 'No data to export',
        color: 'yellow',
      });
      return;
    }

    const exportData = data.map((r, index) => ({
      'S. No.': index + 1,
      'Student': r.student,
      'Student Name': r.student_name || '',
      'Slot': r.slot,
      'Old Course': r.old_course,
      'Old Course Name': r.old_course_name || '',
      'New Course': r.new_course,
      'New Course Name': r.new_course_name || '',
      'Status': r.status,
      'Requested At': new Date(r.created_at).toLocaleString(),
      'Processed At': r.processed_at ? new Date(r.processed_at).toLocaleString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Replacements');
    
    const fileName = `Replacement_${type}_${year}_${semester.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showNotification({
      title: 'Export Successful',
      message: `Data exported to ${fileName}`,
      color: 'green',
    });
  }, [year, semester]);

  const renderTable = (data, showFilter = false) => (
    <Table highlightOnHover withTableBorder>
      <thead>
        <tr>
          <th>S. No.</th>
          <th>Student</th>
          <th>Slot</th>
          <th>Old</th>
          <th>New</th>
          <th>
            <Group spacing="xs" position="apart">
              <span>Status</span>
              {showFilter && (
                <Select
                  placeholder="All"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  data={[
                    { value: '', label: 'All' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Rejected', label: 'Rejected' },
                  ]}
                  size="xs"
                  style={{ width: 100 }}
                  clearable
                />
              )}
            </Group>
          </th>
          <th>Requested At</th>
          {data.some(r => r.processed_at) && <th>Processed At</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((r, index) => (
          <tr key={r.id}>
            <td>{index + 1}</td>
            <td>
              <Text size="sm" weight={500}>{r.student}</Text>
              <Text size="xs" color="dimmed">{r.student_name}</Text>
            </td>
            <td>{r.slot}</td>
            <td>
              <Text size="sm" weight={500}>{r.old_course}</Text>
              <Text size="xs" color="dimmed">{r.old_course_name}</Text>
            </td>
            <td>
              <Text size="sm" weight={500}>{r.new_course}</Text>
              <Text size="xs" color="dimmed">{r.new_course_name}</Text>
            </td>
            <td>
              <Badge
                color={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'yellow'}
                variant="filled"
              >
                {r.status}
              </Badge>
            </td>
            <td>{new Date(r.created_at).toLocaleString()}</td>
            {data.some(req => req.processed_at) && (
              <td>{r.processed_at ? new Date(r.processed_at).toLocaleString() : '-'}</td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <>
      <Card>
        <Stack spacing="md">
          <Group grow align="flex-start">
            <Select
              label="Academic Year"
              placeholder="e.g. 2025-26"
              data={academicYears.map(y => ({ value: y, label: y }))}
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
            <Button 
              size="sm" 
              onClick={fetchRequests} 
              loading={loading}
              disabled={!year || !semester}
            >
              Refresh
            </Button>
            <Button 
              size="sm" 
              color="green" 
              onClick={handleAllocate} 
              loading={allocating}
              disabled={!year || !semester || pendingRequests.length === 0}
            >
              Start Allotment
            </Button>
          </Group>
        </Stack>
      </Card>

      {loading ? (
        <Card mt="md">
          <Loader size="lg" />
        </Card>
      ) : error ? (
        <Alert title="Error" color="red" mt="md">{error}</Alert>
      ) : (!year || !semester) ? (
        <Alert color="gray" mt="md">
          Select academic year and semester to view replacement requests.
        </Alert>
      ) : (
        <Tabs defaultValue="pending" mt="md">
          <Tabs.List>
            <Tabs.Tab value="pending">
              Pending Requests ({pendingRequests.length})
            </Tabs.Tab>
            <Tabs.Tab value="processed">
              Processed Requests ({processedRequests.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending" pt="md">
            {pendingRequests.length > 0 ? (
              <Card>
                <Group position="apart" mb="md">
                  <Title order={4}>Pending Requests</Title>
                  <Button
                    size="sm"
                    color="blue"
                    onClick={() => handleExportToExcel(pendingRequests, 'Pending')}
                    leftSection={<IconFileDownload size={16} />}
                  >
                    Export to Excel
                  </Button>
                </Group>
                {renderTable(pendingRequests)}
              </Card>
            ) : (
              <Alert color="blue">No pending replacement requests.</Alert>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="processed" pt="md">
            {processedRequests.length > 0 ? (
              <Card>
                <Group position="apart" mb="md">
                  <Title order={4}>Processed Requests</Title>
                  <Button
                    size="sm"
                    color="blue"
                    onClick={() => handleExportToExcel(filteredProcessedRequests, 'Processed')}
                    leftSection={<IconFileDownload size={16} />}
                  >
                    Export to Excel
                  </Button>
                </Group>
                {renderTable(filteredProcessedRequests, true)}
              </Card>
            ) : (
              <Alert color="blue">No processed replacement requests.</Alert>
            )}
          </Tabs.Panel>
        </Tabs>
      )}
    </>
  );
}

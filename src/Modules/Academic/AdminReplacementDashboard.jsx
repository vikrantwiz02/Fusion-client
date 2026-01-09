import React, { useEffect, useState, useCallback } from 'react';
import {
  Title, Select, Group, Button,
  Table, Text, Loader, Alert,
  Card, Box, Stack
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
  const academicYears = generateAcademicYears();

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

  const handleExportToExcel = () => {
    if (requests.length === 0) {
      showNotification({
        title: 'No Data',
        message: 'No data to export',
        color: 'yellow',
      });
      return;
    }

    const exportData = requests.map((r, index) => ({
      'S. No.': index + 1,
      'Student': r.student,
      'Slot': r.slot,
      'Old': r.old_course,
      'New': r.new_course,
      'Status': r.status,
      'Requested At': new Date(r.created_at).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Replacements');
    
    const fileName = `Replacement_Allocation_${year}_${semester.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showNotification({
      title: 'Export Successful',
      message: `Data exported to ${fileName}`,
      color: 'green',
    });
  };

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
            <Button size="sm" onClick={fetchRequests} loading={loading}>
              Refresh
            </Button>
            <Button size="sm" color="green" onClick={handleAllocate} loading={allocating}>
              Start Allotment
            </Button>
            <Button 
              size="sm" 
              color="blue" 
              onClick={handleExportToExcel}
              leftIcon={<IconFileDownload size={16} />}
              disabled={requests.length === 0}
            >
              Export Data
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
              <th>S. No.</th>
              <th>Student</th>
              <th>Slot</th>
              <th>Old</th>
              <th>New</th>
              <th>Status</th>
              <th>Requested At</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r, index) => (
              <tr key={r.id}>
                <td>{index + 1}</td>
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

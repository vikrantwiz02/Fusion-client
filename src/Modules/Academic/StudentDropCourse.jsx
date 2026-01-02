import React, { useEffect, useState } from 'react';
import {
  Card, Title, Table, Button, Group,
  Modal, Text, Loader, Alert
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import axios from 'axios';

import {
  studentDropRegistrationsRoute,
  studentDropCourseRoute,
} from '../../routes/academicRoutes';

export default function StudentDropCourse() {
  const [regs, setRegs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [dropping, setDropping] = useState(false);

  // fetch current registrations
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    axios.get(studentDropRegistrationsRoute, {
      headers: { Authorization: `Token ${token}` }
    })
    .then(({ data }) => setRegs(data))
    .catch(err => setError(err.response?.data?.error || err.message))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error)   return <Alert color="red">{error}</Alert>;
  if (!regs.length) return <Text>No courses to drop.</Text>;

  const openModal = reg => setSelected(reg);
  const closeModal = () => setSelected(null);

  const handleDrop = async () => {
    const token = localStorage.getItem('authToken');
    setDropping(true);
    try {
      await axios.post(studentDropCourseRoute,
        { registration_id: selected.id },
        { headers: { Authorization: `Token ${token}` } }
      );
      showNotification({ title: 'Dropped', message: `${selected.course} dropped.`, color: 'green' });
      setRegs(regs.filter(r => r.id !== selected.id));
      closeModal();
    } catch (err) {
      showNotification({
        title: 'Drop failed',
        message: err.response?.data?.error || err.message,
        color: 'red'
      });
    } finally {
      setDropping(false);
    }
  };

  return (
    <Card withBorder p="md">
      <Title order={3} mb="md">Drop Registered Course</Title>
      <Table highlightOnHover withTableBorder>
        <thead>
          <tr>
            <th>Slot</th><th>Course</th><th>Year</th><th>Semester</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {regs.map(r => (
            <tr key={r.id}>
              <td>{r.slot}</td>
              <td>{r.course}</td>
              <td>{r.academic_year}</td>
              <td>{r.semester_type}</td>
              <td>
                <Button color="red" size="xs" onClick={() => openModal(r)}>
                  Drop
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        opened={!!selected}
        onClose={closeModal}
        title="Confirm Drop"
      >
        <Text>Are you sure you want to drop <b>{selected?.course}</b>?</Text>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={closeModal}>Cancel</Button>
          <Button color="red" onClick={handleDrop} loading={dropping}>Yes, Drop</Button>
        </Group>
      </Modal>
    </Card>
  );
}

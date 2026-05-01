import React, { useState, useEffect } from 'react';
import { Flex } from '@mantine/core';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab_ } from '../../redux/moduleslice';

import CustomBreadcrumbs from '../../components/Breadcrumbs';
import ModuleTabs from '../../components/moduleTabs';

import StudentDashboard    from './components/StudentDashboard';
import JobList             from './components/JobList';
import MyApplications      from './components/MyApplications';
import StudentProfile      from './components/StudentProfile';
import CompanyManager      from './components/CompanyManager';
import JobPostManager      from './components/JobPostManager';
import AllStudents         from './components/AllStudents';
import AnnouncementManager from './components/AnnouncementManager';
import PlacementStatistics from './components/PlacementStatistics';
import ExportPanel         from './components/ExportPanel';
import OffCampusManager    from './components/OffCampusManager';

import {
  fetchBatches, fetchAllStudents, fetchOfficerStats, exportPlacementData,
  fetchChairmanStats, fetchChairmanBatches, fetchChairmanStudents, exportChairmanData,
  fetchDeanBatches, fetchDeanStats, fetchDeanAnnouncements,
} from './api';

// ── Student ────────────────────────────────────────────────────────────────
const STUDENT_TABS = [
  { title: 'Dashboard' },
  { title: 'Job Openings' },
  { title: 'My Applications' },
  { title: 'My Profile' },
];
const STUDENT_COMPONENTS = [StudentDashboard, JobList, MyApplications, StudentProfile];

// ── Placement Officer ──────────────────────────────────────────────────────
const OFFICER_TABS = [
  { title: 'Students' },
  { title: 'Off-Campus' },
  { title: 'Companies' },
  { title: 'Job Posts' },
  { title: 'Announcements' },
  { title: 'Statistics' },
  { title: 'Export' },
];

// ── Chairman ───────────────────────────────────────────────────────────────
const CHAIRMAN_TABS = [
  { title: 'Students' },
  { title: 'Statistics' },
  { title: 'Export' },
];

// ── Dean / Faculty ─────────────────────────────────────────────────────────
const DEAN_TABS = [
  { title: 'Statistics' },
  { title: 'Announcements' },
];

export default function PlacementCell() {
  const role     = useSelector((state) => state.user.role);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('0');

  let tabs;
  if (role === 'student')                                            tabs = STUDENT_TABS;
  else if (role === 'placement officer')                             tabs = OFFICER_TABS;
  else if (role === 'placement_chairman' || role === 'placement chairman') tabs = CHAIRMAN_TABS;
  else                                                               tabs = DEAN_TABS;

  // Keep breadcrumb active-tab label in sync
  useEffect(() => {
    const idx = parseInt(activeTab, 10);
    if (tabs[idx]) dispatch(setActiveTab_(tabs[idx].title));
  }, [activeTab, tabs, dispatch]);

  const handleTabChange = (val) => setActiveTab(val);

  const idx = parseInt(activeTab, 10);

  return (
    <>
      <CustomBreadcrumbs />
      <Flex justify="space-between" align="center" mt="lg">
        <ModuleTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
      </Flex>

      <div style={{ padding: '0 8px' }}>
        {role === 'student' && (
          <>
            {idx === 0 && <StudentDashboard />}
            {idx === 1 && <JobList />}
            {idx === 2 && <MyApplications />}
            {idx === 3 && <StudentProfile />}
          </>
        )}

        {role === 'placement officer' && (
          <>
            {idx === 0 && <AllStudents fetchBatchesFn={fetchBatches} fetchStudentsFn={fetchAllStudents} />}
            {idx === 1 && <OffCampusManager />}
            {idx === 2 && <CompanyManager />}
            {idx === 3 && <JobPostManager />}
            {idx === 4 && <AnnouncementManager />}
            {idx === 5 && <PlacementStatistics fetchFn={fetchOfficerStats} fetchBatchesFn={fetchBatches} />}
            {idx === 6 && <ExportPanel exportFn={exportPlacementData} />}
          </>
        )}

        {(role === 'placement_chairman' || role === 'placement chairman') && (
          <>
            {idx === 0 && <AllStudents fetchBatchesFn={fetchChairmanBatches} fetchStudentsFn={fetchChairmanStudents} />}
            {idx === 1 && <PlacementStatistics fetchFn={fetchChairmanStats} fetchBatchesFn={fetchChairmanBatches} />}
            {idx === 2 && <ExportPanel exportFn={exportChairmanData} label="Export Full Report" />}
          </>
        )}

        {role !== 'student' && role !== 'placement officer' && role !== 'placement_chairman' && role !== 'placement chairman' && (
          <>
            {idx === 0 && <PlacementStatistics fetchFn={fetchDeanStats} fetchBatchesFn={fetchDeanBatches} />}
            {idx === 1 && <DeanAnnouncements />}
          </>
        )}
      </div>
    </>
  );
}

function DeanAnnouncements() {
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchDeanAnnouncements().then(setItems).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      {items.length === 0 && <p style={{ color: '#868e96' }}>No announcements.</p>}
      {items.map((a) => (
        <div key={a.id} style={{
          borderLeft: a.is_pinned ? '3px solid #228be6' : '3px solid #dee2e6',
          padding: '12px 16px', marginBottom: 8, background: '#f8f9fa', borderRadius: 4,
        }}>
          <strong>{a.title}</strong>
          <p style={{ margin: '4px 0', fontSize: 14 }}>{a.body}</p>
          <span style={{ fontSize: 12, color: '#868e96' }}>{new Date(a.posted_at).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

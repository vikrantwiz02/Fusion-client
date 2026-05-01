import React, { useState } from 'react';
import { Card, Text, Badge, Group, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { applyToJob } from '../api';

const TYPE_LABEL = { placement: 'Placement', internship: 'Internship', ppo: 'PPO' };
const TYPE_COLOR  = { placement: 'blue', internship: 'grape', ppo: 'teal' };

function deadlineBadgeColor(daysLeft) {
  if (daysLeft <= 1) return 'red';
  if (daysLeft <= 7) return 'orange';
  return 'green';
}

export default function JobCard({ job, onApplied, showApply = true }) {
  const [loading, setLoading]   = useState(false);
  const [applied, setApplied]   = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      await applyToJob(job.id);
      setApplied(true);
      if (onApplied) onApplied(job.id);
      notifications.show({
        title: 'Application Submitted',
        message: `Applied to ${job.role} at ${job.company_name}`,
        color: 'green',
        autoClose: 3000,
      });
    } catch (e) {
      notifications.show({
        title: 'Cannot Apply',
        message: e.message,
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyViaLink = async () => {
    setLinkLoading(true);
    try {
      await applyToJob(job.id);
      setApplied(true);
      if (onApplied) onApplied(job.id);
      notifications.show({
        title: 'Application Tracked',
        message: 'Your application has been recorded. Opening the company portal…',
        color: 'blue',
        autoClose: 3000,
      });
    } catch (e) {
      // If already applied, that's fine — still open the link
      if (!e.message?.toLowerCase().includes('already applied')) {
        notifications.show({ title: 'Note', message: e.message, color: 'yellow', autoClose: 4000 });
      } else {
        setApplied(true);
      }
    } finally {
      setLinkLoading(false);
      window.open(job.apply_link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card withBorder radius="md" p="md" shadow="xs">
      <Stack spacing={6}>
        <Group justify="space-between" wrap="nowrap">
          <Text weight={700} size="md" lineClamp={1}>{job.company_name}</Text>
          <Badge color={TYPE_COLOR[job.job_type] || 'blue'} variant="light">
            {TYPE_LABEL[job.job_type] || job.job_type}
          </Badge>
        </Group>
        <Text size="sm" weight={500}>{job.role}</Text>
        {job.location && <Text size="xs" color="dimmed">{job.location}</Text>}
        <Group spacing="xs">
          {job.ctc != null && (
            <Badge color="teal" variant="outline" size="sm">CTC: {job.ctc} LPA</Badge>
          )}
          {job.stipend != null && (
            <Badge color="teal" variant="outline" size="sm">Stipend: ₹{job.stipend}/mo</Badge>
          )}
          {parseFloat(job.min_cpi) > 0 && (
            <Badge color="gray" variant="outline" size="sm">Min CPI: {job.min_cpi}</Badge>
          )}
        </Group>
        {job.eligible_batches?.length > 0 && (
          <Text size="xs" color="dimmed">Batches: {job.eligible_batches.join(', ')}</Text>
        )}
        <Group position="apart" align="center">
          <Badge color={deadlineBadgeColor(job.days_left)} variant="dot" size="sm">
            {job.days_left === 0 ? 'Deadline today' : `${job.days_left}d left`}
          </Badge>
          {showApply && (
            <Group spacing="xs">
              {/* Normal apply button — shown only if no external-only link or if we want both */}
              {!job.apply_link && (
                <Button
                  size="xs"
                  variant={applied ? 'outline' : 'filled'}
                  color={applied ? 'green' : 'blue'}
                  loading={loading}
                  disabled={applied}
                  onClick={handleApply}
                >
                  {applied ? 'Applied ✓' : 'Apply'}
                </Button>
              )}
              {/* External apply link — tracks application AND opens external portal */}
              {job.apply_link && (
                <Button
                  size="xs"
                  variant={applied ? 'outline' : 'filled'}
                  color={applied ? 'green' : 'blue'}
                  loading={linkLoading}
                  disabled={applied}
                  onClick={handleApplyViaLink}
                >
                  {applied ? 'Applied ✓' : 'Apply via Link ↗'}
                </Button>
              )}
            </Group>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

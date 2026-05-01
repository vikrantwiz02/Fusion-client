import React, { useState } from 'react';
import { Button, Stack, Text, Alert } from '@mantine/core';

export default function ExportPanel({ exportFn, label = 'Export as Excel' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await exportFn();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'placement_data.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing="sm" style={{ maxWidth: 300 }}>
      <Text weight={600}>Export Placement Data</Text>
      <Text size="sm" color="dimmed">Download all placement applications and results as an Excel file.</Text>
      {error && <Alert color="red">{error}</Alert>}
      <Button onClick={handleExport} loading={loading}>{label}</Button>
    </Stack>
  );
}

import { useEffect, useState } from "react";
import { Button, Card, Center, Loader, Stack, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ErrorState } from "../../ui/components/ErrorState";
import { databaseFiltersRoute } from "../../routes/academicRoutes";
import { findReport } from "./reports";

export default function ReportPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const report = findReport(reportId);
  const [state, setState] = useState({
    loading: true,
    error: null,
    filters: null,
  });

  useEffect(() => {
    if (!report) return undefined;
    const token = localStorage.getItem("authToken");
    let cancelled = false;
    axios
      .get(databaseFiltersRoute, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      })
      .then(({ data }) => {
        if (!cancelled)
          setState({ loading: false, error: null, filters: data });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error, filters: null });
      });
    return () => {
      cancelled = true;
    };
  }, [report]);

  const back = (
    <Button
      variant="subtle"
      leftSection={<IconArrowLeft size={16} />}
      onClick={() => navigate("/database/view")}
      style={{ alignSelf: "flex-start" }}
    >
      All reports
    </Button>
  );

  if (!report) {
    return (
      <Stack gap="md">
        {back}
        <Text c="dimmed">That report does not exist.</Text>
      </Stack>
    );
  }

  const { Component } = report;

  return (
    <Stack gap="md">
      {back}
      <Card withBorder padding="lg" radius="md">
        <Stack gap={2} mb="md">
          <Text fw={600} size="lg">
            {report.title}
          </Text>
          <Text size="sm" c="dimmed">
            {report.summary}
          </Text>
        </Stack>

        {state.loading && (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        )}
        {state.error && <ErrorState error={state.error} />}
        {state.filters && <Component filters={state.filters} />}
      </Card>
    </Stack>
  );
}

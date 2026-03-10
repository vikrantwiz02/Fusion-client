import React, { useEffect, useState } from "react";
import {
  Button,
  Paper,
  Textarea,
  Title,
  Loader,
  Group,
  Text,
  Box,
} from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { compounderRoute } from "../../../../routes/health_center";
import NavCom from "../NavCom";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";

function Application() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  const get_application = async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
    try {
      const response = await axios.post(
        compounderRoute,
        { aid: id, get_application: 1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      setApplication(response.data.inbox);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    get_application();
  }, [id]);

  const handle_forward = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        { file_id: id, compounder_forward: 1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      alert("Application forwarded");
      navigate("/healthcenter/compounder/medical-relief/inbox");
    } catch (err) {
      console.log(err);
    }
  };

  const handle_reject = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        {
          file_id: id,
          rejected_user: application?.uploader,
          compounder_reject: 1,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      alert("Application rejected");
      navigate("/healthcenter/compounder/medical-relief/inbox");
    } catch (err) {
      console.log(err);
    }
  };

  const view_file = () => {
    console.log("Viewing file for application:", id);
  };

  if (loading) {
    return (
      <>
        <CustomBreadcrumbs />
        <NavCom />
        <br />
        <Paper
          shadow="sm"
          p="xl"
          withBorder
          style={{
            borderColor: "#e0e0e0",
            borderRadius: "8px",
          }}
        >
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <Loader color="#15abff" size="md" />
          </Box>
        </Paper>
      </>
    );
  }

  if (!application) {
    return (
      <>
        <CustomBreadcrumbs />
        <NavCom />
        <br />
        <Paper
          shadow="sm"
          p="xl"
          withBorder
          style={{
            borderColor: "#e0e0e0",
            borderRadius: "8px",
          }}
        >
          <Box
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#7F8C8D",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <Text size="lg" fw={500}>
              No Application Available!
            </Text>
            <Text size="sm" c="dimmed">
              The requested application could not be found
            </Text>
            <Button
              color="#15abff"
              style={{ marginTop: "20px" }}
              onClick={() =>
                navigate("/healthcenter/compounder/medical-relief/inbox")
              }
            >
              Return to Inbox
            </Button>
          </Box>
        </Paper>
      </>
    );
  }

  return (
    <>
      <CustomBreadcrumbs />
      <NavCom />
      <br />
      <Paper
        shadow="sm"
        p="xl"
        withBorder
        style={{
          borderColor: "#e0e0e0",
          borderRadius: "8px",
          backgroundColor: "white",
        }}
      >
        <div style={{ padding: "1rem" }}>
          <Title
            order={3}
            style={{
              marginBottom: "1.5rem",
              color: "#15abff",
              fontWeight: 600,
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "15px",
            }}
          >
            Medical Relief Application
          </Title>

          <Box mb={30}>
            <Text fw={500} size="lg" mb={5}>
              Applicant:{" "}
              <span style={{ color: "#15abff" }}>{application.uploader}</span>
            </Text>
          </Box>

          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Textarea
                style={{ flex: 1, maxWidth: "40%" }}
                readOnly
                label="Submission Date"
                value={application.upload_date || ""}
                minRows={1}
                styles={{
                  label: { fontWeight: 500, marginBottom: "8px" },
                  input: {
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #e0e0e0",
                  },
                }}
              />
              <Textarea
                style={{ flex: 1 }}
                readOnly
                label="Description"
                value={application.desc || ""}
                minRows={6}
                styles={{
                  label: { fontWeight: 500, marginBottom: "8px" },
                  input: {
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #e0e0e0",
                  },
                }}
              />
            </div>
            <br />
            <Group position="left" spacing="md">
              <Button
                color="#15abff"
                variant="outline"
                onClick={view_file}
                style={{ fontWeight: 500 }}
              >
                View File
              </Button>
              <Button
                color="#15abff"
                onClick={handle_forward}
                style={{ fontWeight: 500 }}
              >
                Forward
              </Button>
              <Button
                color="red"
                variant="light"
                onClick={handle_reject}
                style={{ fontWeight: 500 }}
              >
                Reject
              </Button>
            </Group>
          </div>
        </div>
      </Paper>
    </>
  );
}

export default Application;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Paper, Title, Loader, Text, Container, Box } from "@mantine/core";
import NavCom from "../NavCom";
import { compounderRoute } from "../../../../routes/health_center";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";

function FeedbackTable() {
  const [feedbackData, setFeedbackData] = useState({ complaints: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeedback = async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
    try {
      const response = await axios.post(
        compounderRoute,
        { get_feedback: 1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      setFeedbackData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Unable to load feedback data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const tableStyles = {
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      marginTop: "20px",
      borderRadius: "8px",
      overflow: "hidden",
    },
    header: {
      backgroundColor: "#f9f9f9",
      color: "#333",
      padding: "16px 12px",
      fontWeight: 600,
      textAlign: "left",
      fontSize: "0.9rem",
    },
    row: {
      transition: "background-color 0.2s",
    },
    cell: {
      padding: "14px 12px",
      color: "#333",
      fontSize: "0.9rem",
    },
  };

  return (
    <div>
      <CustomBreadcrumbs />
      <NavCom />
      <Container size="xl" style={{ margin: "2rem auto" }}>
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Box mb={30}>
            <Title
              order={3}
              style={{
                textAlign: "center",
                color: "#15abff",
                fontWeight: 600,
              }}
            >
              Feedback Management
            </Title>
          </Box>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Loader color="#15abff" size="md" />
            </div>
          ) : error ? (
            <Text color="red" align="center">
              {error}
            </Text>
          ) : feedbackData.complaints.length === 0 ? (
            <Text color="dimmed" align="center" py={30}>
              No feedback entries found.
            </Text>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.header}>Feedback By</th>
                    <th style={tableStyles.header}>Feedback</th>
                    <th style={tableStyles.header}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackData.complaints.map((item) => (
                    <tr key={item.id} style={tableStyles.row}>
                      <td style={tableStyles.cell}>{item.user_id}</td>
                      <td style={tableStyles.cell}>{item.complaint}</td>
                      <td style={tableStyles.cell}>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Paper>
      </Container>
    </div>
  );
}

export default FeedbackTable;

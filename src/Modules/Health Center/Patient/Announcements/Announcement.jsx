import React, { useEffect, useState } from "react";
import { Paper, Table, Title, Loader, Text, Box } from "@mantine/core";
import axios from "axios";
import { studentRoute } from "../../../../routes/health_center";
import NavPatient from "../Navigation";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";

function Announcement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const get_announcement = async () => {
      const token = localStorage.getItem("authToken");
      setLoading(true);
      try {
        const response = await axios.post(
          studentRoute,
          { get_annoucements: 1 },
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          },
        );
        setAnnouncements(response.data.announcements || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    get_announcement();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader color="#15abff" size="md" />
        </Box>
      );
    }

    if (!announcements || announcements.length === 0) {
      return (
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
            No announcements found
          </Text>
          <Text size="sm" c="dimmed">
            There are currently no announcements available
          </Text>
        </Box>
      );
    }

    return (
      <Table
        horizontalSpacing="lg"
        verticalSpacing="md"
        style={{ width: "100%" }}
      >
        <Table.Tbody>
          {announcements.map((element, index) => (
            <Table.Tr key={index}>
              <Table.Td
                style={{
                  borderLeft: "4px solid #15abff",
                  backgroundColor: "white",
                  color: "#2c3e50",
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  margin: "8px 0",
                  borderRadius: "0 4px 4px 0",
                }}
              >
                {element.message}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  };

  return (
    <>
      <CustomBreadcrumbs />
      <NavPatient />
      <br />
      <Paper
        p="xl"
        shadow="sm"
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
              textAlign: "center",
              color: "#15abff",
              fontWeight: 600,
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "15px",
              marginBottom: "20px",
            }}
          >
            Announcements
          </Title>
          {renderContent()}
        </div>
      </Paper>
    </>
  );
}

export default Announcement;

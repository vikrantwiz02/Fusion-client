import { Paper, Table, Title, Loader, Text, Group, Box } from "@mantine/core";
import { useEffect, useState } from "react";
import { Download } from "@phosphor-icons/react";
import { useSelector } from "react-redux";
import axios from "axios";
import { studentRoute } from "../../../../routes/health_center";
import NavPatient from "../Navigation";
import MedicalNavBar from "./medicalPath";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";

function Approval() {
  const [elements, setMedical] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = useSelector((state) => state.user.role);

  const get_relief = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        studentRoute,
        { get_relief: 1, selected_role: role },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      setMedical(response.data.relief || []);
    } catch (err) {
      console.log(err);
      setMedical([]);
    } finally {
      setLoading(false);
    }
  };

  const get_status = (element) => {
    if (element.status1 === true) return "Approved";
    if (element.status === true) return "Forwarded";
    if (element.status2 === true) return "Rejected";
    return "Pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "#2ECC71";
      case "Forwarded":
        return "#F39C12";
      case "Rejected":
        return "#E74C3C";
      case "Pending":
        return "#15abff";
      default:
        return "#7F8C8D";
    }
  };

  useEffect(() => {
    get_relief();
  }, [role]);

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

    if (elements.length === 0) {
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
            No medical relief applications found
          </Text>
        </Box>
      );
    }

    return (
      <Table
        withTableBorder
        withColumnBorders
        highlightOnHover
        striped
        horizontalSpacing="sm"
        verticalSpacing="sm"
      >
        <Table.Thead style={{ backgroundColor: "#f5f9ff" }}>
          <Table.Tr>
            <Table.Th style={{ color: "#15abff" }}>Approval Date</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>Uploaded Date</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>Description</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>File</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {elements.map((element) => (
            <Table.Tr key={element.id}>
              <Table.Td>{element.approval_date}</Table.Td>
              <Table.Td>{element.upload_date}</Table.Td>
              <Table.Td>{element.desc}</Table.Td>
              <Table.Td>
                <Group gap="xs" align="center">
                  <Download size={20} color="#15abff" />
                  <Text size="sm">{element.file}</Text>
                </Group>
              </Table.Td>
              <Table.Td
                style={{
                  color: getStatusColor(get_status(element)),
                  fontWeight: 500,
                }}
              >
                {get_status(element)}
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
      <MedicalNavBar />
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
        <div>
          <Title
            order={3}
            style={{
              textAlign: "center",
              margin: "0 0 20px 0",
              color: "#15abff",
              fontWeight: 600,
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "15px",
            }}
          >
            Medical Relief Status
          </Title>
          {renderContent()}
        </div>
      </Paper>
    </>
  );
}

export default Approval;

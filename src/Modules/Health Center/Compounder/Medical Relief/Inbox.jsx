import { Paper, Table, Title, Loader, Text, Group, Box } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Download } from "@phosphor-icons/react";
import axios from "axios";
import NavCom from "../NavCom";
import { compounderRoute } from "../../../../routes/health_center";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";

function Inbox() {
  const navigate = useNavigate();
  const [elements, setMedical] = useState([]);
  const [loading, setLoading] = useState(true);

  const get_relief = async () => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
    try {
      const response = await axios.post(
        compounderRoute,
        { get_relief: 1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      setMedical(response.data.relief);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (id, status) => {
    if (status === "Pending") {
      navigate(
        `/healthcenter/compounder/medical-relief/inbox/application/${id}`,
      );
    }
  };

  const get_status = (element) => {
    if (element.status1 === true) return "Approved";
    if (element.status === true) return "Forwarded";
    if (element.status2 === true) return "Rejected";
    return "Pending";
  };

  useEffect(() => {
    get_relief();
  }, []);

  const rows = elements.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td>{element.uploader}</Table.Td>
      <Table.Td>{element.upload_date}</Table.Td>
      <Table.Td>{element.desc}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Download size={20} color="#15abff" />
          <Text size="sm">{element.file}</Text>
        </Group>
      </Table.Td>
      <Table.Td
        onClick={() => handleStatusClick(element.id, get_status(element))}
        style={{
          cursor: get_status(element) === "Pending" ? "pointer" : "default",
          color:
            get_status(element) === "Pending"
              ? "#15abff"
              : get_status(element) === "Approved"
                ? "#2ECC71"
                : get_status(element) === "Rejected"
                  ? "#E74C3C"
                  : "#7F8C8D",
          fontWeight: 500,
        }}
      >
        {get_status(element)}
      </Table.Td>
    </Table.Tr>
  ));

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
            No data found
          </Text>
          <Text size="sm" c="dimmed">
            There are no medical relief applications in your inbox
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
        style={{ backgroundColor: "white" }}
      >
        <Table.Thead style={{ backgroundColor: "#f5f9ff" }}>
          <Table.Tr>
            <Table.Th style={{ color: "#15abff" }}>Uploaded ID</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>Uploaded Date</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>Description</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>File</Table.Th>
            <Table.Th style={{ color: "#15abff" }}>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    );
  };

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
          overflow: "hidden",
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
            Inbox
          </Title>
          {renderContent()}
        </div>
      </Paper>
    </>
  );
}

export default Inbox;

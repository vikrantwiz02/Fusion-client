import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Pagination,
  Paper,
  Table,
  TextInput,
  Title,
  Loader,
  Center,
  Text,
} from "@mantine/core";
import axios from "axios";
import NavCom from "../Navigation";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";
import { studentRoute } from "../../../../routes/health_center";

function HistoryPatient() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [activePage, setPage] = useState(1);

  const navigate = useNavigate();

  const fetchHistory = async (pagenumber) => {
    const token = localStorage.getItem("authToken");
    setLoading(true);
    try {
      const response = await axios.post(
        studentRoute,
        {
          page: pagenumber,
          search_patientlog: search,
          datatype: "patientlog",
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      setHistory(response.data.report);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      console.error("Error fetching patient history:", err);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentPage = async (e) => {
    setPage(e);
    fetchHistory(e);
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleViewClick = (id) => {
    navigate(`/healthcenter/student/prescription/${id}`);
  };

  const rows = history.map((element) => (
    <tr key={element.id}>
      <td style={{ textAlign: "center" }}>{element.doctor_id}</td>
      <td style={{ textAlign: "center" }}>{element.date}</td>
      <td style={{ textAlign: "center" }}>{element.details}</td>
      <td style={{ textAlign: "center" }}>{element.dependent_name}</td>
      <td style={{ textAlign: "center" }}>
        <Button
          onClick={() => handleViewClick(element.id)}
          style={{ backgroundColor: "#15abff", color: "#fff" }}
        >
          View
        </Button>
      </td>
    </tr>
  ));

  return (
    <>
      <CustomBreadcrumbs />
      <NavCom />
      <br />
      <Paper
        shadow="xl"
        p="xl"
        withBorder
        style={{ backgroundColor: "white", borderRadius: "12px" }}
      >
        <Title
          order={3}
          align="center"
          style={{
            marginBottom: "20px",
            color: "#15abff",
            fontWeight: 700,
          }}
        >
          Prescription History
        </Title>

        <TextInput
          placeholder="Search by doctor, date or details..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchHistory(1);
          }}
          size="md"
          mb="md"
        />

        {loading ? (
          <Center py="xl">
            <Loader color="#15abff" size="lg" />
          </Center>
        ) : history.length > 0 ? (
          <>
            <Table
              withTableBorder
              withColumnBorders
              highlightOnHover
              striped
              horizontalSpacing="sm"
              verticalSpacing="sm"
              style={{
                borderCollapse: "collapse",
                border: "1px solid #ccc",
                backgroundColor: "white",
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: "center" }}>
                    Treated By
                  </Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>Date</Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>Details</Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>Report</Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>
                    View Prescription
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody style={{ fontSize: "15px" }}>{rows}</Table.Tbody>
            </Table>

            <Pagination
              value={activePage}
              onChange={setCurrentPage}
              total={totalPages}
              style={{
                marginTop: "20px",
                marginLeft: "auto",
                marginRight: "auto",
                width: "fit-content",
              }}
              color="#15abff"
              radius="xl"
              size="md"
            />
          </>
        ) : (
          <Center style={{ padding: "40px" }}>
            <Text size="lg" weight={500} color="dimmed">
              No data found.
            </Text>
          </Center>
        )}
      </Paper>
    </>
  );
}

export default HistoryPatient;

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Loader,
  Paper,
  Text,
  Title,
  Group,
  Card,
} from "@mantine/core";
import { IconPrinter, IconPhone, IconStethoscope } from "@tabler/icons-react";
import axios from "axios";
import NavCom from "../NavCom";
import Changenav from "./changenav";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";
import { compounderRoute } from "../../../../routes/health_center";
import Adddoctor from "./adddoctor";

export default function DoctorPath() {
  const primaryColor = "#15abff";
  const deleteColor = "#ff3c00";

  const handlePrint = () => {
    window.print();
  };

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        { get_doctors: 1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response.data);
      setDoctors(response.data.doctors || []);
      console.log(doctors);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handelRemove = async (doctorName) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        {
          doctor_active: doctorName,
          remove_doctor: 1,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response);
      alert("Doctor Removed Successfully");
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Loader color={primaryColor} size="lg" />
      </Flex>
    );
  }

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable, .printable * {
              visibility: visible;
            }
            .printable {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none;
            }
          }
        `}
      </style>

      <Box className="no-print">
        <CustomBreadcrumbs />
        <NavCom />
        <Changenav />
      </Box>

      <Container size="lg" py="xl">
        <Adddoctor />
        <br />
        <Paper
          shadow="md"
          p="xl"
          withBorder
          radius="md"
          className="printable"
          bg="white"
        >
          <Group position="apart" mb="xl" justify="space-between">
            <Title
              order={3}
              sx={{
                color: primaryColor,
                fontWeight: 600,
                borderBottom: `3px solid ${primaryColor}`,
                paddingBottom: "8px",
              }}
              style={{
                color: "#15abff",
              }}
            >
              Doctor's List
            </Title>

            <Button
              onClick={handlePrint}
              leftIcon={<IconPrinter size={20} />}
              color={primaryColor}
              radius="md"
              className="no-print"
            >
              Print
            </Button>
          </Group>

          {doctors.length === 0 ? (
            <Flex justify="center" p="xl">
              <Text size="lg" color="dimmed">
                No doctor records available.
              </Text>
            </Flex>
          ) : (
            <Box>
              {doctors.map((doctor, index) => (
                <Card
                  key={index}
                  mb="lg"
                  p="md"
                  radius="md"
                  sx={{
                    borderLeft: `4px solid ${primaryColor}`,
                    boxShadow:
                      "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                    transition: "all 0.3s",
                    "&:hover": {
                      boxShadow:
                        "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
                    },
                  }}
                >
                  <Group position="apart">
                    <Group justify="space-between">
                      <Box>
                        <Text size="lg" weight={600}>
                          {doctor.doctor_name}
                        </Text>
                        <Group spacing="xs">
                          <IconStethoscope size={16} color={primaryColor} />
                          <Text size="sm" color="dimmed">
                            {doctor.specialization}
                          </Text>
                        </Group>
                        <Group spacing="xs">
                          <IconPhone size={16} color={primaryColor} />
                          <Text size="sm">{doctor.doctor_phone}</Text>
                        </Group>
                      </Box>

                      <Button
                        variant="outline"
                        color={deleteColor}
                        radius="md"
                        onClick={() => {
                          handelRemove(doctor.id);
                        }}
                        className="no-print"
                      >
                        Make Inactive
                      </Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
}

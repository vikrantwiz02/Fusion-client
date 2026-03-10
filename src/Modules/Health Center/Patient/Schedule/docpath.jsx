import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Group,
  Loader,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import axios from "axios";
import { IconPhone, IconPrinter, IconStethoscope } from "@tabler/icons-react";
import NavCom from "../Navigation";
import Changenav from "./schedulePath";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";
import { compounderRoute } from "../../../../routes/health_center";

export default function DoctorPath() {
  const handlePrint = () => {
    window.print();
  };

  const primaryColor = "#15abff";

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
      console.log(response);
      setDoctors(response.data.doctors);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
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

      <Box className="`no-print">
        <CustomBreadcrumbs />
        <NavCom />
        <Changenav />
      </Box>

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
            Download
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
                  </Group>
                </Group>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </>
  );
}

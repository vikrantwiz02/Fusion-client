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
  Card,
  Group,
} from "@mantine/core";
import { IconPrinter, IconPhone, IconMicroscope } from "@tabler/icons-react";
import axios from "axios";
import NavCom from "../NavCom";
import Changenav from "./changenav";
import CustomBreadcrumbs from "../../../../components/Breadcrumbs";
import { compounderRoute } from "../../../../routes/health_center";
import Addpath from "./addpath";

export default function PathDoc() {
  const primaryColor = "#15abff";
  const deleteColor = "#ff3c00";

  const handlePrint = () => {
    window.print();
  };

  const [pathologists, setPathologists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPathologists = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        { get_pathologists: 1 },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      setPathologists(response.data.pathologists || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPathologists();
  }, []);

  const handelRemove = async (doctorName) => {
    if (doctorName === "") {
      alert("select doctor");
    }
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        compounderRoute,
        {
          pathologist_active: doctorName,
          remove_pathologist: 1,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        },
      );
      console.log(response);
      alert("Pathologist Removed Successfully");
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

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
        <Addpath />
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
              Pathologist's List
            </Title>

            <Button
              onClick={handlePrint}
              leftIcon={<IconPrinter size={20} />}
              color={primaryColor}
              radius="md"
              className="no-print"
            >
              Print List
            </Button>
          </Group>

          {pathologists.length === 0 ? (
            <Flex justify="center" p="xl">
              <Text size="lg" color="dimmed">
                No pathologist records available.
              </Text>
            </Flex>
          ) : (
            <Box>
              {pathologists.map((pathologist, index) => (
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
                    <Group>
                      <Box>
                        <Text size="lg" weight={600}>
                          {pathologist.pathologist_name}
                        </Text>
                        <Group spacing="xs">
                          <IconMicroscope size={16} color={primaryColor} />
                          <Text size="sm" color="dimmed">
                            {pathologist.specialization}
                          </Text>
                        </Group>
                        <Group spacing="xs">
                          <IconPhone size={16} color={primaryColor} />
                          <Text size="sm">{pathologist.pathologist_phone}</Text>
                        </Group>
                      </Box>

                      <Button
                        variant="outline"
                        color={deleteColor}
                        radius="md"
                        onClick={() => {
                          handelRemove(pathologist.id);
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

import { useState } from "react";
import PropTypes from "prop-types";
import {
  Anchor,
  Badge,
  Button,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import {
  ArrowSquareOut,
  Briefcase,
  Plus,
  Stack as StackIcon,
} from "@phosphor-icons/react";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";
import { EmptyState, SectionCard } from "./profileUi";

const authHeader = () => ({
  Authorization: `Token ${localStorage.getItem("authToken")}`,
});

const period = (from, to) => [from, to].filter(Boolean).join("  →  ") || "—";

const statusColor = (status) => (status === "COMPLETED" ? "teal" : "blue");

function InternshipsTab({ internshipsData }) {
  const [formData, setFormData] = useState({
    organization: "",
    location: "",
    job_title: "",
    status: "ONGOING",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.organization.trim()) {
      notifications.show({
        message: "Enter the organization first.",
        color: "red",
      });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        updateProfileDataRoute,
        { experiencesubmit: formData },
        { headers: authHeader() },
      );
      notifications.show({
        message: "Experience Added Successfully!",
        color: "green",
      });
      setFormData({
        organization: "",
        location: "",
        job_title: "",
        status: "ONGOING",
        start_date: "",
        end_date: "",
        description: "",
      });
    } catch (error) {
      notifications.show({
        message: "Failed! Please try later.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard
        icon={<Plus size={18} />}
        title="Add an Experience"
        description="Internships and jobs"
      >
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Organization Name"
              value={formData.organization}
              onChange={(e) =>
                handleChange("organization", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Job Profile Title"
              value={formData.job_title}
              onChange={(e) => handleChange("job_title", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Status"
              data={["ONGOING", "COMPLETED"]}
              value={formData.status}
              onChange={(value) => handleChange("status", value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                handleChange("start_date", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange("end_date", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              autosize
              minRows={3}
              value={formData.description}
              onChange={(e) =>
                handleChange("description", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Group justify="flex-end">
              <Button
                onClick={handleSubmit}
                loading={saving}
                leftSection={<Plus size={16} />}
              >
                Add experience
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<Briefcase size={18} />}
        title="Your Experience"
        action={
          internshipsData?.length ? (
            <Badge variant="light" radius="sm">
              {internshipsData.length}
            </Badge>
          ) : null
        }
      >
        {internshipsData?.length ? (
          <Stack gap="sm">
            {internshipsData.map((item) => (
              <Paper
                key={`${item.organization}-${item.job_title}-${item.sdate}`}
                withBorder
                radius="md"
                p="md"
              >
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      {item.job_title || "—"}
                    </Text>
                    <Text size="sm" c="dimmed" mt={2}>
                      {item.organization || "—"}
                      {item.location ? ` · ${item.location}` : ""}
                    </Text>
                    <Text size="xs" c="dimmed" mt={6}>
                      {period(item.sdate, item.edate)}
                    </Text>
                  </div>
                  {item.status && (
                    <Badge
                      variant="light"
                      radius="sm"
                      color={statusColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<Briefcase size={26} />}
            message="No experience added yet"
          />
        )}
      </SectionCard>
    </>
  );
}

function ProjectsTab({ projectsData }) {
  const [formData, setFormData] = useState({
    project_name: "",
    status: "ONGOING",
    project_link: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.project_name.trim()) {
      notifications.show({
        message: "Enter the project name first.",
        color: "red",
      });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        updateProfileDataRoute,
        { projectsubmit: formData },
        { headers: authHeader() },
      );
      notifications.show({
        message: "Project Added Successfully!",
        color: "green",
      });
      setFormData({
        project_name: "",
        status: "ONGOING",
        project_link: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    } catch (error) {
      notifications.show({
        message: "Failed! Please try later.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard
        icon={<Plus size={18} />}
        title="Add a Project"
        description="Personal, course and club projects"
      >
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Project Name"
              value={formData.project_name}
              onChange={(e) =>
                handleChange("project_name", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Status"
              data={["ONGOING", "COMPLETED"]}
              value={formData.status}
              onChange={(value) => handleChange("status", value)}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Project Link"
              placeholder="https://github.com/..."
              value={formData.project_link}
              onChange={(e) =>
                handleChange("project_link", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                handleChange("start_date", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange("end_date", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              autosize
              minRows={3}
              value={formData.description}
              onChange={(e) =>
                handleChange("description", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Group justify="flex-end">
              <Button
                onClick={handleSubmit}
                loading={saving}
                leftSection={<Plus size={16} />}
              >
                Add project
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<StackIcon size={18} />}
        title="Your Projects"
        action={
          projectsData?.length ? (
            <Badge variant="light" radius="sm">
              {projectsData.length}
            </Badge>
          ) : null
        }
      >
        {projectsData?.length ? (
          <Stack gap="sm">
            {projectsData.map((project) => (
              <Paper
                key={`${project.project_name}-${project.start_date || project.sdate}`}
                withBorder
                radius="md"
                p="md"
              >
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      {project.project_name || "—"}
                    </Text>
                    {project.project_link && (
                      <Anchor
                        href={project.project_link}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                      >
                        <Group gap={4} wrap="nowrap">
                          <ArrowSquareOut size={13} />
                          <Text span size="sm" truncate>
                            {project.project_link}
                          </Text>
                        </Group>
                      </Anchor>
                    )}
                    <Text size="xs" c="dimmed" mt={6}>
                      {period(
                        project.sdate || project.start_date,
                        project.edate || project.end_date,
                      )}
                    </Text>
                  </div>
                  {project.status && (
                    <Badge
                      variant="light"
                      radius="sm"
                      color={statusColor(project.status)}
                    >
                      {project.status}
                    </Badge>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<StackIcon size={26} />}
            message="No projects added yet"
          />
        )}
      </SectionCard>
    </>
  );
}

export default function WorkExperienceComponent({ experience, project }) {
  const [view, setView] = useState("experience");

  return (
    <Stack gap="md" w="100%">
      <SegmentedControl
        value={view}
        onChange={setView}
        radius="md"
        data={[
          { value: "experience", label: "Work Experience" },
          { value: "projects", label: "Projects" },
        ]}
      />
      {view === "experience" ? (
        <InternshipsTab internshipsData={experience} />
      ) : (
        <ProjectsTab projectsData={project} />
      )}
    </Stack>
  );
}

const EXPERIENCE_SHAPE = PropTypes.arrayOf(
  PropTypes.shape({
    organization: PropTypes.string,
    location: PropTypes.string,
    job_title: PropTypes.string,
    status: PropTypes.string,
    sdate: PropTypes.string,
    edate: PropTypes.string,
  }),
);

const PROJECT_SHAPE = PropTypes.arrayOf(
  PropTypes.shape({
    project_name: PropTypes.string,
    status: PropTypes.string,
    project_link: PropTypes.string,
    sdate: PropTypes.string,
    edate: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
  }),
);

WorkExperienceComponent.propTypes = {
  experience: EXPERIENCE_SHAPE,
  project: PROJECT_SHAPE,
};

WorkExperienceComponent.defaultProps = { experience: [], project: [] };

InternshipsTab.propTypes = { internshipsData: EXPERIENCE_SHAPE };
InternshipsTab.defaultProps = { internshipsData: [] };

ProjectsTab.propTypes = { projectsData: PROJECT_SHAPE };
ProjectsTab.defaultProps = { projectsData: [] };

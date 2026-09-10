import { useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { Certificate, GraduationCap, Plus } from "@phosphor-icons/react";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";
import { EmptyState, SectionCard } from "./profileUi";

const authHeader = () => ({
  Authorization: `Token ${localStorage.getItem("authToken")}`,
});

const period = (from, to) => [from, to].filter(Boolean).join("  →  ") || "—";

function EducationTab({ educationData }) {
  const [formData, setFormData] = useState({
    degree: "",
    stream: "",
    institute: "",
    grade: "",
    start_date: "",
    end_date: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.degree.trim()) {
      notifications.show({ message: "Enter the degree first.", color: "red" });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        updateProfileDataRoute,
        { education: formData },
        { headers: authHeader() },
      );
      notifications.show({
        message: "Education Added Successfully!",
        color: "green",
      });
      setFormData({
        degree: "",
        stream: "",
        institute: "",
        grade: "",
        start_date: "",
        end_date: "",
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
        title="Add a Qualification"
        description="Schooling and earlier degrees"
      >
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Degree"
              placeholder="e.g. Class XII, B.Tech"
              value={formData.degree}
              onChange={(e) => handleChange("degree", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Stream"
              value={formData.stream}
              onChange={(e) => handleChange("stream", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Institute Name"
              value={formData.institute}
              onChange={(e) => handleChange("institute", e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Grade"
              value={formData.grade}
              onChange={(e) => handleChange("grade", e.currentTarget.value)}
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
            <Group justify="flex-end">
              <Button
                onClick={handleSubmit}
                loading={saving}
                leftSection={<Plus size={16} />}
              >
                Add qualification
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<GraduationCap size={18} />}
        title="Your Education"
        action={
          educationData?.length ? (
            <Badge variant="light" radius="sm">
              {educationData.length}
            </Badge>
          ) : null
        }
      >
        {educationData?.length ? (
          <Stack gap="sm">
            {educationData.map((edu) => (
              <Paper
                key={`${edu.degree}-${edu.institute}-${edu.sdate}`}
                withBorder
                radius="md"
                p="md"
              >
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      {edu.degree || "—"}
                      {edu.stream ? ` · ${edu.stream}` : ""}
                    </Text>
                    <Text size="sm" c="dimmed" mt={2}>
                      {edu.institute || "—"}
                    </Text>
                    <Text size="xs" c="dimmed" mt={6}>
                      {period(edu.sdate, edu.edate)}
                    </Text>
                  </div>
                  {edu.grade && (
                    <Badge variant="light" color="teal" radius="sm">
                      {edu.grade}
                    </Badge>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<GraduationCap size={26} />}
            message="No qualifications added yet"
          />
        )}
      </SectionCard>
    </>
  );
}

function CoursesTab({ coursesData }) {
  const [formData, setFormData] = useState({
    course_name: "",
    license: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.course_name.trim()) {
      notifications.show({
        message: "Enter the course name first.",
        color: "red",
      });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        updateProfileDataRoute,
        { coursesubmit: formData },
        { headers: authHeader() },
      );
      notifications.show({
        message: "Certificate added successfully!",
        color: "green",
      });
      setFormData({
        course_name: "",
        license: "",
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
        title="Add a Certification"
        description="Online and offline certificate courses"
      >
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Course Name"
              value={formData.course_name}
              onChange={(e) =>
                handleChange("course_name", e.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="License No."
              value={formData.license}
              onChange={(e) => handleChange("license", e.currentTarget.value)}
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
                Add certification
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<Certificate size={18} />}
        title="Your Certificates"
        action={
          coursesData?.length ? (
            <Badge variant="light" radius="sm">
              {coursesData.length}
            </Badge>
          ) : null
        }
      >
        {coursesData?.length ? (
          <Stack gap="sm">
            {coursesData.map((course) => (
              <Paper
                key={`${course.course_name}-${course.license_no}-${course.sdate}`}
                withBorder
                radius="md"
                p="md"
              >
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      {course.course_name || "—"}
                    </Text>
                    <Text size="xs" c="dimmed" mt={6}>
                      {period(course.sdate, course.edate)}
                    </Text>
                  </div>
                  {course.license_no && (
                    <Badge variant="light" radius="sm">
                      {course.license_no}
                    </Badge>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<Certificate size={26} />}
            message="No certificates added yet"
          />
        )}
      </SectionCard>
    </>
  );
}

export default function EducationCoursesComponent({ education, courses }) {
  const [view, setView] = useState("education");

  return (
    <Stack gap="md" w="100%">
      <SegmentedControl
        value={view}
        onChange={setView}
        radius="md"
        data={[
          { value: "education", label: "Education" },
          { value: "courses", label: "Certificate Courses" },
        ]}
      />
      {view === "education" ? (
        <EducationTab educationData={education} />
      ) : (
        <CoursesTab coursesData={courses} />
      )}
    </Stack>
  );
}

const EDUCATION_SHAPE = PropTypes.arrayOf(
  PropTypes.shape({
    degree: PropTypes.string,
    stream: PropTypes.string,
    institute: PropTypes.string,
    grade: PropTypes.string,
    sdate: PropTypes.string,
    edate: PropTypes.string,
  }),
);

const COURSE_SHAPE = PropTypes.arrayOf(
  PropTypes.shape({
    course_name: PropTypes.string,
    license_no: PropTypes.string,
    sdate: PropTypes.string,
    edate: PropTypes.string,
    description: PropTypes.string,
  }),
);

EducationCoursesComponent.propTypes = {
  education: EDUCATION_SHAPE,
  courses: COURSE_SHAPE,
};

EducationCoursesComponent.defaultProps = { education: [], courses: [] };

EducationTab.propTypes = { educationData: EDUCATION_SHAPE };
EducationTab.defaultProps = { educationData: [] };

CoursesTab.propTypes = { coursesData: COURSE_SHAPE };
CoursesTab.defaultProps = { coursesData: [] };

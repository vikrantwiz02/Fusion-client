import { useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { Plus, Trophy } from "@phosphor-icons/react";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";
import { EmptyState, SectionCard } from "./profileUi";

function AchievementsComponent({ achievements }) {
  const [achievement, setAchievement] = useState({
    skill: "",
    type: "Educational",
    date: "",
    issuer: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setAchievement((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!achievement.skill.trim()) {
      notifications.show({
        message: "Give the achievement a name first.",
        color: "red",
      });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        updateProfileDataRoute,
        {
          achievementsubmit: {
            skill: achievement.skill,
            type: achievement.type,
            date: achievement.date,
            issuer: achievement.issuer,
            description: achievement.description,
          },
        },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem("authToken")}`,
          },
        },
      );

      notifications.show({
        message: "Achievement added successfully!",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        message: "Error adding achievement.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" w="100%">
      <SectionCard
        icon={<Plus size={18} />}
        title="Add an Achievement"
        description="Awards, certifications and recognitions"
      >
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Achievement name"
              placeholder="e.g. Smart India Hackathon Finalist"
              value={achievement.skill}
              onChange={(event) =>
                handleChange("skill", event.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Type"
              data={["Educational", "Other"]}
              value={achievement.type}
              onChange={(value) => handleChange("type", value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Date"
              type="date"
              value={achievement.date}
              onChange={(event) =>
                handleChange("date", event.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Issuer"
              placeholder="Who awarded it"
              value={achievement.issuer}
              onChange={(event) =>
                handleChange("issuer", event.currentTarget.value)
              }
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              autosize
              minRows={3}
              value={achievement.description}
              onChange={(event) =>
                handleChange("description", event.currentTarget.value)
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
                Add achievement
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<Trophy size={18} />}
        title="Your Achievements"
        action={
          achievements?.length ? (
            <Badge variant="light" radius="sm">
              {achievements.length}
            </Badge>
          ) : null
        }
      >
        {achievements?.length ? (
          <Stack gap="sm">
            {achievements.map((ach) => (
              <Paper
                key={`${ach.issuer}-${ach.date_earned}-${ach.description}`}
                withBorder
                radius="md"
                p="md"
              >
                <Group justify="space-between" align="flex-start" gap="sm">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm">
                      {ach.issuer || "—"}
                    </Text>
                    {ach.description && (
                      <Text size="sm" c="dimmed" mt={4}>
                        {ach.description}
                      </Text>
                    )}
                  </div>
                  <Stack gap={6} align="flex-end">
                    <Badge variant="light" radius="sm">
                      {ach.achievement_type || "Other"}
                    </Badge>
                    {ach.date_earned && (
                      <Text size="xs" c="dimmed">
                        {ach.date_earned}
                      </Text>
                    )}
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<Trophy size={26} />}
            message="No achievements added yet"
            hint="Add awards, certifications and competition results."
          />
        )}
      </SectionCard>
    </Stack>
  );
}

AchievementsComponent.propTypes = {
  achievements: PropTypes.arrayOf(
    PropTypes.shape({
      achievement_type: PropTypes.string,
      date_earned: PropTypes.string,
      issuer: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
};

AchievementsComponent.defaultProps = { achievements: [] };

export default AchievementsComponent;

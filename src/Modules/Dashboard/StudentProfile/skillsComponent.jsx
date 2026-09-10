import { useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Grid,
  Group,
  NumberInput,
  Paper,
  Progress,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Sparkle } from "@phosphor-icons/react";
import axios from "axios";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";
import { EmptyState, SectionCard } from "./profileUi";

const RATING_COLOR = (rating) => {
  if (rating >= 4) return "teal";
  if (rating >= 3) return "blue";
  if (rating >= 2) return "yellow";
  return "gray";
};

function SkillsTechComponent({ data }) {
  const [skills, setSkills] = useState(data || []);
  const [newSkill, setNewSkill] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const updateSkills = async () => {
    if (!newSkill.trim()) {
      notifications.show({
        title: "Error",
        message: "Skill name cannot be empty!",
        color: "red",
      });
      return;
    }

    if (rating < 0 || rating > 5) {
      notifications.show({
        title: "Error",
        message: "Rating must be between 0 and 5",
        color: "red",
      });
      return;
    }

    const newSkillEntry = {
      skillsubmit: {
        skill_id: {
          skill_name: newSkill,
        },
        skill_rating: rating,
      },
    };

    setSaving(true);
    try {
      await axios.put(updateProfileDataRoute, newSkillEntry, {
        headers: {
          Authorization: `Token ${localStorage.getItem("authToken")}`,
        },
      });

      setSkills([...skills, { skill_name: newSkill, skill_rating: rating }]);
      setNewSkill("");
      setRating(0);
      notifications.show({
        title: "Success",
        message: "Skill added successfully!",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to update skills. Please try again.",
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
        title="Add a Skill"
        description="Rate yourself out of 5"
      >
        <Grid gutter="md" align="flex-end">
          <Grid.Col span={{ base: 12, sm: 7 }}>
            <TextInput
              label="Skill / Technology"
              placeholder="e.g. Python, Figma, Verilog"
              value={newSkill}
              onChange={(event) => setNewSkill(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 7, sm: 3 }}>
            <NumberInput
              label="Rating"
              min={0}
              max={5}
              clampBehavior="strict"
              value={rating}
              onChange={setRating}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 5, sm: 2 }}>
            <Button
              fullWidth
              onClick={updateSkills}
              loading={saving}
              leftSection={<Plus size={16} />}
            >
              Add
            </Button>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<Sparkle size={18} />}
        title="Your Skills"
        action={
          skills.length ? (
            <Badge variant="light" radius="sm">
              {skills.length}
            </Badge>
          ) : null
        }
      >
        {skills.length ? (
          <Stack gap="xs">
            {skills.map((skill) => (
              <Paper
                key={`${skill.skill_name}-${skill.skill_rating}`}
                withBorder
                radius="md"
                p="sm"
              >
                <Group justify="space-between" gap="md" wrap="nowrap">
                  <Text size="sm" fw={500} style={{ flex: 1, minWidth: 0 }}>
                    {skill.skill_name}
                  </Text>
                  <Progress
                    value={(Number(skill.skill_rating) / 5) * 100}
                    color={RATING_COLOR(Number(skill.skill_rating))}
                    radius="xl"
                    size="sm"
                    w={140}
                  />
                  <Badge
                    variant="light"
                    radius="sm"
                    color={RATING_COLOR(Number(skill.skill_rating))}
                  >
                    {skill.skill_rating}/5
                  </Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <EmptyState
            icon={<Sparkle size={26} />}
            message="No skills added yet"
            hint="Add the tools and languages you work with."
          />
        )}
      </SectionCard>
    </Stack>
  );
}

SkillsTechComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      skill_name: PropTypes.string.isRequired,
      skill_rating: PropTypes.number.isRequired,
    }),
  ),
};

SkillsTechComponent.defaultProps = { data: [] };

export default SkillsTechComponent;

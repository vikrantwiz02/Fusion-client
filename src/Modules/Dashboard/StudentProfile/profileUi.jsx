import PropTypes from "prop-types";
import { Box, Grid, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";

export const DASH = "—";

export const HALF = { base: 12, sm: 6 };
export const FULL = { base: 12 };

export function SectionCard({ icon, title, description, action, children }) {
  return (
    <Paper withBorder radius="md" p="lg" shadow="xs" w="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" radius="md" size="lg" color="blue">
            {icon}
          </ThemeIcon>
          <div>
            <Text fw={600} size="md">
              {title}
            </Text>
            {description && (
              <Text size="xs" c="dimmed">
                {description}
              </Text>
            )}
          </div>
        </Group>
        {action}
      </Group>
      {children}
    </Paper>
  );
}

SectionCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
};

SectionCard.defaultProps = { description: "", action: null };

// A read-only value gets the same footprint as the input that replaces it, so
// switching into edit mode does not make the card jump.
export function ReadOnlyValue({ children }) {
  return (
    <Box
      px="sm"
      py={7}
      style={{
        minHeight: 34,
        borderRadius: 8,
        border: "1px solid var(--mantine-color-gray-2)",
        background: "var(--mantine-color-gray-0)",
      }}
    >
      <Text size="sm" fw={500} style={{ wordBreak: "break-word" }}>
        {children}
      </Text>
    </Box>
  );
}

ReadOnlyValue.propTypes = { children: PropTypes.node.isRequired };

export function Field({ label, span, children }) {
  return (
    <Grid.Col span={span}>
      <Text
        size="xs"
        c="dimmed"
        fw={600}
        tt="uppercase"
        mb={6}
        style={{ letterSpacing: "0.04em" }}
      >
        {label}
      </Text>
      {children}
    </Grid.Col>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  span: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  children: PropTypes.node.isRequired,
};

Field.defaultProps = { span: HALF };

export function EmptyState({ icon, message, hint }) {
  return (
    <Stack align="center" gap={6} py="xl">
      <ThemeIcon variant="light" color="gray" radius="xl" size={54}>
        {icon}
      </ThemeIcon>
      <Text fw={500} size="sm">
        {message}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed">
          {hint}
        </Text>
      )}
    </Stack>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired,
  hint: PropTypes.string,
};

EmptyState.defaultProps = { hint: "" };

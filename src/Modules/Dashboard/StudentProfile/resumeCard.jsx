import { useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  ArrowSquareOut,
  ArrowsOut,
  Check,
  Info,
  PencilSimple,
  ReadCvLogo,
  X,
} from "@phosphor-icons/react";
import axios from "axios";
import { studentProfileUpdateRoute } from "../../../routes/globalRoutes";
import { SectionCard } from "./profileUi";

const PREVIEW_HEIGHT = 260;

// Drive and Docs both serve an embeddable /preview for the same file id.
export function drivePreviewUrl(link) {
  if (!link) return "";
  const file = link.match(
    /https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/,
  );
  if (file) return `https://drive.google.com/file/d/${file[1]}/preview`;
  const doc = link.match(
    /https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([\w-]+)/,
  );
  if (doc) return `https://docs.google.com/${doc[1]}/d/${doc[2]}/preview`;
  return "";
}

export default function ResumeCard({ link, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(link || "");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const preview = drivePreviewUrl(link);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.post(
        studentProfileUpdateRoute,
        { resume_link: draft.trim() },
        { headers: token ? { Authorization: `Token ${token}` } : {} },
      );
      onSaved(data.data);
      notifications.show({ message: "Resume link saved.", color: "green" });
      setError(null);
      setEditing(false);
    } catch (err) {
      const body = err.response?.data;
      setError(body?.errors?.resume_link || body?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const actions = editing ? (
    <Group gap="xs" wrap="nowrap">
      <Button
        size="xs"
        variant="default"
        leftSection={<X size={14} />}
        onClick={() => {
          setDraft(link || "");
          setError(null);
          setEditing(false);
        }}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        size="xs"
        leftSection={<Check size={14} />}
        onClick={save}
        loading={saving}
      >
        Save
      </Button>
    </Group>
  ) : (
    <Group gap="xs" wrap="nowrap">
      {link && (
        <Button
          size="xs"
          variant="subtle"
          component="a"
          href={link}
          target="_blank"
          rel="noreferrer"
          leftSection={<ArrowSquareOut size={14} />}
        >
          Open
        </Button>
      )}
      <Button
        size="xs"
        variant="light"
        leftSection={<PencilSimple size={14} />}
        onClick={() => {
          setDraft(link || "");
          setEditing(true);
        }}
      >
        {link ? "Update link" : "Add link"}
      </Button>
    </Group>
  );

  return (
    <SectionCard
      icon={<ReadCvLogo size={18} />}
      title="Resume"
      description="Google Drive link, replaceable any time"
      action={actions}
    >
      {editing && (
        <TextInput
          mb="md"
          value={draft}
          error={error}
          placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          onChange={(event) => {
            setDraft(event.currentTarget.value);
            setError(null);
          }}
        />
      )}

      <Alert
        variant="light"
        color="blue"
        radius="md"
        icon={<Info size={18} />}
        mb={link ? "md" : 0}
      >
        <Text size="sm">
          In Drive, set the file&apos;s sharing to{" "}
          <Text span fw={600}>
            Anyone with the link can view
          </Text>
          . If you skip this, the resume will still open for you but nobody else
          will be able to see it.
        </Text>
      </Alert>

      {link && preview && (
        <Paper
          withBorder
          radius="md"
          p={0}
          style={{ overflow: "hidden", position: "relative" }}
        >
          <Box style={{ height: PREVIEW_HEIGHT, background: "#f8fafc" }}>
            <iframe
              src={preview}
              title="Resume preview"
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </Box>
          <Button
            size="xs"
            variant="white"
            leftSection={<ArrowsOut size={14} />}
            onClick={() => setExpanded(true)}
            style={{
              position: "absolute",
              right: 10,
              bottom: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,.18)",
            }}
          >
            Expand
          </Button>
        </Paper>
      )}

      {link && !preview && (
        <Text size="sm" c="dimmed">
          Saved, but this link cannot be previewed here.{" "}
          <Anchor href={link} target="_blank" rel="noreferrer">
            Open it in Drive
          </Anchor>
          .
        </Text>
      )}

      <Modal
        opened={expanded}
        onClose={() => setExpanded(false)}
        title="Resume"
        size="80rem"
        radius="md"
        centered
      >
        <Box style={{ height: "75vh" }}>
          <iframe
            src={preview}
            title="Resume"
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </Box>
      </Modal>
    </SectionCard>
  );
}

ResumeCard.propTypes = {
  link: PropTypes.string,
  onSaved: PropTypes.func.isRequired,
};

ResumeCard.defaultProps = { link: "" };

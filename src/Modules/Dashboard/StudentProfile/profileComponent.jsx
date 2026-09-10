import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Grid, Group, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Check,
  PencilSimple,
  Phone,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import axios from "axios";
import { updateProfileDataRoute } from "../../../routes/dashboardRoutes";
import AdmissionDetails, { RECORD_SHAPE } from "./admissionDetails";
import { Field, FULL, ReadOnlyValue, SectionCard } from "./profileUi";
import ResumeCard from "./resumeCard";

function ProfileComponent({ data, record, onRecordChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    about: data.profile?.about_me || "",
    dob: data.profile?.date_of_birth || "",
    address: data.profile?.address || "",
    contactNumber: data.profile?.phone_no ?? "",
    mailId: data.current?.[0]?.user?.email ?? "",
  });

  const handleEditClick = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      notifications.show({
        message: "Authentication required. Please log in again.",
        color: "red",
      });
      return;
    }
    if (isEditing) {
      if (submitting) return;
      setSubmitting(true);
      try {
        // With an admission record the other fields live there, so only the
        // free-text bio goes to the account.
        const payload = {
          profilesubmit: record
            ? { about_me: profileData.about }
            : {
                about_me: profileData.about,
                date_of_birth: profileData.dob,
                address: profileData.address,
                phone_no: Number(profileData.contactNumber),
              },
        };

        await axios.put(updateProfileDataRoute, payload, {
          headers: { Authorization: `Token ${token}` },
        });

        notifications.show({
          message: "Profile updated successfully!",
          color: "green",
        });
        setIsEditing(false);
      } catch {
        notifications.show({
          message: "Error updating profile. Please try again.",
          color: "red",
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const aboutActions = isEditing ? (
    <Group gap="xs" wrap="nowrap">
      <Button
        size="xs"
        variant="default"
        leftSection={<X size={14} />}
        onClick={() => setIsEditing(false)}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        size="xs"
        leftSection={<Check size={14} />}
        onClick={handleEditClick}
        loading={submitting}
      >
        Save
      </Button>
    </Group>
  ) : (
    <Button
      size="xs"
      variant="light"
      leftSection={<PencilSimple size={14} />}
      onClick={handleEditClick}
    >
      Edit
    </Button>
  );

  return (
    <Stack gap="md" w="100%">
      <SectionCard
        icon={<UserCircle size={18} />}
        title="About Me"
        action={aboutActions}
      >
        {isEditing ? (
          <TextInput
            value={profileData.about}
            placeholder="A line about yourself"
            onChange={(e) => handleChange("about", e.target.value)}
          />
        ) : (
          <ReadOnlyValue>{profileData.about || "—"}</ReadOnlyValue>
        )}
      </SectionCard>

      {record && (
        <ResumeCard link={record.resume_link} onSaved={onRecordChange} />
      )}

      {!record && (
        <SectionCard icon={<Phone size={18} />} title="Details">
          <Grid gutter="md">
            <Field label="Date of Birth">
              {isEditing ? (
                <TextInput
                  value={profileData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              ) : (
                <ReadOnlyValue>{profileData.dob || "—"}</ReadOnlyValue>
              )}
            </Field>
            <Field label="Contact Number">
              {isEditing ? (
                <TextInput
                  value={profileData.contactNumber}
                  onChange={(e) =>
                    handleChange("contactNumber", e.target.value)
                  }
                />
              ) : (
                <ReadOnlyValue>
                  {profileData.contactNumber || "—"}
                </ReadOnlyValue>
              )}
            </Field>
            <Field label="Mail ID">
              <ReadOnlyValue>{profileData.mailId || "—"}</ReadOnlyValue>
            </Field>
            <Field label="Address" span={FULL}>
              {isEditing ? (
                <TextInput
                  value={profileData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              ) : (
                <ReadOnlyValue>{profileData.address || "—"}</ReadOnlyValue>
              )}
            </Field>
          </Grid>
        </SectionCard>
      )}

      <AdmissionDetails
        record={record}
        email={profileData.mailId}
        onSaved={onRecordChange}
      />
    </Stack>
  );
}

ProfileComponent.propTypes = {
  data: PropTypes.shape({
    profile: PropTypes.shape({
      about_me: PropTypes.string,
      date_of_birth: PropTypes.string,
      address: PropTypes.string,
      phone_no: PropTypes.number,
      user_type: PropTypes.string,
    }),
    current: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.shape({
          email: PropTypes.string,
        }),
      }),
    ),
  }).isRequired,
  record: RECORD_SHAPE,
  onRecordChange: PropTypes.func,
};

ProfileComponent.defaultProps = {
  record: null,
  onRecordChange: () => {},
};

export default ProfileComponent;

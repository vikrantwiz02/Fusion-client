import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Center,
  FileButton,
  Flex,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Camera } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { PageTabs } from "../../../ui/components/PageTabs";
import avatarImage from "../../../assets/avatar.png";
import ProfileComponent from "./profileComponent";
import SkillsTechComponent from "./skillsComponent";
import AchievementsComponent from "./achievementsComponent";
import WorkExperienceComponent from "./workExperienceComponent";
import EducationCoursesComponent from "./educationCoursesComponent";
import { getProfileDataRoute } from "../../../routes/dashboardRoutes";
import {
  host,
  profileCompletionRoute,
  studentProfileImageRoute,
} from "../../../routes/globalRoutes";
import { setProfilePhoto } from "../../../redux/userslice";

const PHOTO_MAX_KB = 200;

function InfoCard({ data, photo, onPhotoChange, width }) {
  const primaryHolder = data.current?.[0];
  const isStudent = data.profile?.user_type === 'student';
  const [uploading, setUploading] = useState(false);

  const upload = (file) => {
    if (!file) return;
    const okType =
      ["image/png", "image/jpeg", "image/jpg"].includes(file.type) ||
      /\.(png|jpe?g)$/i.test(file.name);
    if (!okType) {
      notifications.show({
        title: "Invalid file type",
        message: "Only PNG, JPG or JPEG images are allowed.",
        color: "red",
      });
      return;
    }
    if (file.size > PHOTO_MAX_KB * 1024) {
      notifications.show({
        title: "File too large",
        message: `Must be ${PHOTO_MAX_KB} KB or less (selected ${Math.round(file.size / 1024)} KB).`,
        color: "red",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const token = localStorage.getItem("authToken");
        const { data: res } = await axios.post(
          studentProfileImageRoute,
          { kind: "photo", image: reader.result },
          { headers: token ? { Authorization: `Token ${token}` } : {} },
        );
        onPhotoChange(`${res.photo}?t=${Date.now()}`);
        notifications.show({ message: "Photo updated.", color: "green" });
      } catch (err) {
        notifications.show({
          title: "Could not update the photo",
          message: err.response?.data?.message || "Please try again.",
          color: "red",
        });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const batch =
    isStudent && primaryHolder?.user?.username
      ? `20${String(primaryHolder.user.username).slice(0, 2)}`
      : "";

  return (
    <Card withBorder shadow="sm" radius="lg" w={width} padding={0}>
      <Box style={{ position: "relative" }}>
        <Image
          src={photo ? `${host}${photo}` : avatarImage}
          h={300}
          fit="cover"
          alt={primaryHolder?.user?.first_name || "Profile photo"}
        />
        {isStudent && onPhotoChange && (
          <FileButton onChange={upload} accept="image/png,image/jpeg">
            {({ onClick }) => (
              <Tooltip
                label={`${photo ? "Change" : "Upload"} photo · PNG or JPEG, up to ${PHOTO_MAX_KB} KB`}
                withArrow
                multiline
                w={200}
              >
                <ActionIcon
                  onClick={onClick}
                  loading={uploading}
                  variant="white"
                  color="dark"
                  radius="xl"
                  size="lg"
                  aria-label="Change profile photo"
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    boxShadow: "0 2px 10px rgba(0,0,0,.25)",
                  }}
                >
                  <Camera size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </FileButton>
        )}
      </Box>

      <Stack gap={6} p="md">
        <Text fw={700} size="lg" lh={1.2} tt="uppercase">
          {primaryHolder?.user?.first_name ?? "—"}
        </Text>
        <Text size="sm" c="dimmed" fw={500}>
          {primaryHolder?.user?.username ?? "—"}
        </Text>

        <Group gap={6} mt={4}>
          {data.profile?.department?.name && (
            <Badge variant="light" radius="sm">
              {data.profile.department.name}
              {batch ? ` · ${batch}` : ""}
            </Badge>
          )}
          {isStudent && data.semester_no != null && (
            <Badge variant="light" color="grape" radius="sm">
              Sem {data.semester_no}
            </Badge>
          )}
        </Group>

        <Text size="xs" c="dimmed" tt="capitalize" mt={2}>
          {data.profile?.user_type ?? "User"}
        </Text>
      </Stack>
    </Card>
  );
}

function Profile() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("0");
  const [profileData, setProfileData] = useState(null);
  const [record, setRecord] = useState(null);
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("authToken");
      if (!token) return console.error("No authentication token found!");
      try {
        const response = await axios.get(getProfileDataRoute, {
          headers: { Authorization: `Token ${token}` },
        });
        setProfileData(response.data);
      } catch (err) {
        setError("Error fetching profile data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
      // Older batches have no admission record; the page simply shows less.
      try {
        const { data } = await axios.get(profileCompletionRoute, {
          headers: { Authorization: `Token ${token}` },
        });
        if (data?.success) {
          setRecord(data.data);
          setPhoto(data.data.photo || "");
          dispatch(setProfilePhoto(data.data.photo || ""));
        }
      } catch {
        setRecord(null);
      }
    }
    fetchProfile();
  }, [dispatch]);

  if (loading)
    return (
      <Center py={80}>
        <Loader />
      </Center>
    );
  if (error) return <Text c="red">{error}</Text>;

  const isStudent = profileData?.profile?.user_type === "student";

  const changePhoto = record
    ? (next) => {
        setPhoto(next);
        dispatch(setProfilePhoto(next));
      }
    : null;

  const tabItems = isStudent
    ? [
        { title: "Profile" },
        { title: "Skills & Technologies" },
        { title: "Education & Courses" },
        { title: "Work Experience" },
        { title: "Achievements" },
      ]
    : [{ title: "Profile" }];

  const tabToDisplay = isStudent
    ? [
        <ProfileComponent
          key="profile"
          data={profileData}
          record={record}
          onRecordChange={setRecord}
        />,
        <SkillsTechComponent key="skills" data={profileData?.skills} />,
        <EducationCoursesComponent
          key="education"
          education={profileData?.education}
          courses={profileData?.course}
        />,
        <WorkExperienceComponent
          key="work"
          experience={profileData?.experience ?? []}
          project={profileData?.project ?? []}
        />,
        <AchievementsComponent key="achievements" achievements={profileData?.achievement} />,
      ]
    : [<ProfileComponent key="profile" data={profileData} />];

  return (
    <Stack>
      <PageTabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={tabItems.map((item, index) => ({
          value: String(index),
          label: item.title,
        }))}
      />
      <Box hiddenFrom="md" px={{ base: 0, sm: "sm" }}>
        <InfoCard
          data={profileData}
          photo={photo}
          onPhotoChange={changePhoto}
          width="100%"
        />
      </Box>

      <Flex
        align="flex-start"
        gap="lg"
        wrap="nowrap"
        px={{ base: 0, sm: "sm" }}
        mt="sm"
      >
        <Box style={{ flex: 1, minWidth: 0 }}>{tabToDisplay[activeTab]}</Box>
        <Box visibleFrom="md" style={{ position: "sticky", top: 16 }}>
          <InfoCard
            data={profileData}
            photo={photo}
            onPhotoChange={changePhoto}
          />
        </Box>
      </Flex>
    </Stack>
  );
}

InfoCard.propTypes = {
  photo: PropTypes.string,
  onPhotoChange: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  data: PropTypes.shape({
    semester_no: PropTypes.number,
    current: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.shape({
          first_name: PropTypes.string,
          username: PropTypes.string,
        }),
      }),
    ),
    profile: PropTypes.shape({
      department: PropTypes.shape({
        name: PropTypes.string,
      }),
    }),
  }).isRequired,
};

InfoCard.defaultProps = {
  photo: "",
  onPhotoChange: null,
  width: 300,
};

export default Profile;

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  FileButton,
  Grid,
  Group,
  Image,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Check,
  IdentificationCard,
  MapPin,
  PencilSimple,
  Phone,
  ShieldCheck,
  Signature as SignatureIcon,
  Upload,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import axios from "axios";
import {
  host,
  studentProfileImageRoute,
  studentProfileUpdateRoute,
} from "../../../routes/globalRoutes";
import { STUDENT_FIELDS_CONFIG } from "../../Program_curriculum/Acad_admin/AdminUpcomingBatchesConstants";
import {
  DASH,
  Field,
  FULL,
  HALF,
  ReadOnlyValue,
  SectionCard,
} from "./profileUi";

const SIGNATURE_MAX_KB = 30;

const TEXT = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

export const RECORD_SHAPE = PropTypes.shape({
  editable: PropTypes.arrayOf(PropTypes.string),
  programme_type: PropTypes.string,
  roll_number: TEXT,
  name: PropTypes.string,
  photo: PropTypes.string,
  signature: PropTypes.string,
});

const show = (value) => {
  const text = typeof value === "number" ? String(value) : (value || "").trim();
  return text || DASH;
};

// Only digits, so a pasted "+91 " or a stray space cannot fail validation later.
const digits = (value) => String(value || "").replace(/\D/g, "");
const money = (value) => String(value || "").replace(/[^\d.]/g, "");

const SECTIONS = [
  {
    title: "Verified Details",
    description: "From your admission record",
    icon: <ShieldCheck size={18} />,
    rows: [
      { key: "roll_number", label: "Roll Number" },
      { key: "name", label: "Name" },
      { key: "discipline", label: "Discipline" },
      { key: "specialization", label: "Specialization", pgOnly: true },
      { key: "gender", label: "Gender" },
      { key: "category", label: "Category" },
      { key: "date_of_birth", label: "Date of Birth" },
      { key: "admission_mode", label: "Admission Mode" },
    ],
  },
  {
    title: "Contact",
    icon: <Phone size={18} />,
    rows: [
      { key: "phone_number", label: "Mobile No.", clean: digits },
      { key: "email", label: "Mail ID" },
      { key: "parent_email", label: "Parent's Email ID", span: FULL },
    ],
  },
  {
    title: "Identity",
    icon: <IdentificationCard size={18} />,
    rows: [
      { key: "hindi_name", label: "Name (Hindi)" },
      { key: "aadhar_number", label: "Aadhaar No.", clean: digits },
      { key: "apaar_id", label: "APAAR ID", clean: digits },
      {
        key: "blood_group",
        label: "Blood Group",
        type: "select",
        options: STUDENT_FIELDS_CONFIG.bloodGroup.options,
      },
      {
        key: "blood_group_remarks",
        label: "Blood Group (specify)",
        onlyIfOtherBloodGroup: true,
      },
      { key: "nationality", label: "Nationality" },
      { key: "minority", label: "Minority" },
    ],
  },
  {
    title: "Family",
    icon: <UsersThree size={18} />,
    rows: [
      { key: "father_name", label: "Father's Name" },
      { key: "mother_name", label: "Mother's Name" },
      { key: "father_occupation", label: "Father's Occupation" },
      { key: "mother_occupation", label: "Mother's Occupation" },
      { key: "father_mobile", label: "Father's Mobile", clean: digits },
      { key: "mother_mobile", label: "Mother's Mobile", clean: digits },
    ],
  },
  {
    title: "Address & Income",
    icon: <MapPin size={18} />,
    rows: [
      { key: "address", label: "Address", type: "textarea", span: FULL },
      {
        key: "state",
        label: "State",
        type: "select",
        options: STUDENT_FIELDS_CONFIG.state.options,
      },
      { key: "country", label: "Country" },
      {
        key: "income_group",
        label: "Income Group",
        type: "select",
        options: STUDENT_FIELDS_CONFIG.incomeGroup.options,
      },
      { key: "income", label: "Annual Income", clean: money },
    ],
  },
];

export default function AdmissionDetails({ record, email, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  const editable = useMemo(
    () => new Set(record?.editable || []),
    [record?.editable],
  );

  if (!record) return null;

  const value = (key) => (key in form ? form[key] : (record[key] ?? ""));

  const set = (key, next) => {
    setForm((prev) => ({ ...prev, [key]: next }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const cancel = () => {
    setForm({});
    setErrors({});
    setEditing(false);
  };

  const save = async () => {
    const changed = Object.fromEntries(
      Object.entries(form).filter(
        ([key]) => editable.has(key) && form[key] !== (record[key] ?? ""),
      ),
    );
    if (!Object.keys(changed).length) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.post(studentProfileUpdateRoute, changed, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      onSaved(data.data);
      notifications.show({ message: "Profile updated.", color: "green" });
      cancel();
    } catch (err) {
      const body = err.response?.data;
      setErrors(body?.errors || {});
      notifications.show({
        title: "Could not save",
        message: body?.message || "Please try again.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadSignature = (file) => {
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
    if (file.size > SIGNATURE_MAX_KB * 1024) {
      notifications.show({
        title: "File too large",
        message: `Must be ${SIGNATURE_MAX_KB} KB or less (selected ${Math.round(file.size / 1024)} KB).`,
        color: "red",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      setSigning(true);
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await axios.post(
          studentProfileImageRoute,
          { kind: "signature", image: reader.result },
          { headers: token ? { Authorization: `Token ${token}` } : {} },
        );
        onSaved({ ...record, signature: `${data.signature}?t=${Date.now()}` });
        notifications.show({ message: "Signature updated.", color: "green" });
      } catch (err) {
        notifications.show({
          title: "Could not update the signature",
          message: err.response?.data?.message || "Please try again.",
          color: "red",
        });
      } finally {
        setSigning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const control = (row) => {
    const current = String(value(row.key) ?? "");
    const error = errors[row.key];
    if (row.type === "select") {
      return (
        <Select
          value={current}
          error={error}
          data={row.options}
          searchable
          placeholder="Select"
          onChange={(next) => set(row.key, next || "")}
        />
      );
    }
    if (row.type === "textarea") {
      return (
        <Textarea
          value={current}
          error={error}
          autosize
          minRows={2}
          onChange={(event) => set(row.key, event.currentTarget.value)}
        />
      );
    }
    return (
      <TextInput
        value={current}
        error={error}
        onChange={(event) =>
          set(
            row.key,
            row.clean
              ? row.clean(event.currentTarget.value)
              : event.currentTarget.value,
          )
        }
      />
    );
  };

  const visibleRows = (rows) =>
    rows.filter((row) => {
      if (row.pgOnly && record.programme_type !== "pg") return false;
      if (row.onlyIfOtherBloodGroup && value("blood_group") !== "Other")
        return false;
      return true;
    });

  const cellFor = (row) => {
    if (row.key === "email")
      return <ReadOnlyValue>{show(email)}</ReadOnlyValue>;
    if (editing && editable.has(row.key)) return control(row);
    return <ReadOnlyValue>{show(record[row.key])}</ReadOnlyValue>;
  };

  const actions = editing ? (
    <Group gap="xs" wrap="nowrap">
      <Button
        size="xs"
        variant="default"
        leftSection={<X size={14} />}
        onClick={cancel}
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
        Save changes
      </Button>
    </Group>
  ) : (
    <Button
      size="xs"
      variant="light"
      leftSection={<PencilSimple size={14} />}
      onClick={() => setEditing(true)}
    >
      Edit details
    </Button>
  );

  return (
    <>
      {SECTIONS.map((section, index) => (
        <SectionCard
          key={section.title}
          icon={section.icon}
          title={section.title}
          description={section.description}
          action={index === 0 ? actions : null}
        >
          <Grid gutter="md">
            {visibleRows(section.rows).map((row) => (
              <Field key={row.key} label={row.label} span={row.span || HALF}>
                {cellFor(row)}
              </Field>
            ))}
          </Grid>
        </SectionCard>
      ))}

      <SectionCard
        icon={<SignatureIcon size={18} />}
        title="Signature"
        description={`PNG or JPEG, up to ${SIGNATURE_MAX_KB} KB`}
        action={
          <FileButton onChange={uploadSignature} accept="image/png,image/jpeg">
            {({ onClick }) => (
              <Button
                onClick={onClick}
                size="xs"
                variant="light"
                leftSection={<Upload size={14} />}
                loading={signing}
              >
                {record.signature ? "Replace" : "Upload"}
              </Button>
            )}
          </FileButton>
        }
      >
        {record.signature ? (
          <Paper
            withBorder
            radius="md"
            p="sm"
            bg="var(--mantine-color-gray-0)"
            style={{ width: "fit-content" }}
          >
            <Image
              src={`${host}${record.signature}`}
              alt="Signature"
              h={64}
              w="auto"
              fit="contain"
            />
          </Paper>
        ) : (
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              No signature on record yet.
            </Text>
          </Stack>
        )}
      </SectionCard>

      <Text size="xs" c="dimmed" ta="center">
        Details left blank at admission can be filled in once. Anything already
        recorded is corrected by the academic section.
      </Text>
    </>
  );
}

AdmissionDetails.propTypes = {
  record: RECORD_SHAPE,
  email: PropTypes.string,
  onSaved: PropTypes.func.isRequired,
};

AdmissionDetails.defaultProps = {
  record: null,
  email: "",
};

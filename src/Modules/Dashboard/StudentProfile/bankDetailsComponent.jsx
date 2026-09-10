import { useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Button,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Bank, Check, Info, PencilSimple, X } from "@phosphor-icons/react";
import axios from "axios";
import { studentProfileUpdateRoute } from "../../../routes/globalRoutes";
import { DASH, Field, HALF, ReadOnlyValue, SectionCard } from "./profileUi";

const FIELDS = [
  {
    key: "bank_name",
    label: "Bank Name",
    placeholder: "e.g. State Bank of India",
  },
  {
    key: "bank_account_no",
    label: "Bank Account No.",
    placeholder: "9 to 18 digits",
    clean: (value) => String(value || "").replace(/\D/g, ""),
  },
  {
    key: "ifsc_code",
    label: "IFSC Code",
    placeholder: "e.g. SBIN0001234",
    clean: (value) =>
      String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11),
  },
];

export default function BankDetailsComponent({ record, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const value = (key) => (key in form ? form[key] : (record?.[key] ?? ""));

  const cancel = () => {
    setForm({});
    setErrors({});
    setEditing(false);
  };

  const save = async () => {
    const changed = Object.fromEntries(
      Object.entries(form).filter(
        ([key]) => form[key] !== (record?.[key] ?? ""),
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
      notifications.show({ message: "Bank details saved.", color: "green" });
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
    <Stack gap="md" w="100%">
      <SectionCard
        icon={<Bank size={18} />}
        title="Bank Details"
        description="Used for stipend and reimbursement payments"
        action={actions}
      >
        <Grid gutter="md">
          {FIELDS.map((field) => (
            <Field key={field.key} label={field.label} span={HALF}>
              {editing ? (
                <TextInput
                  value={String(value(field.key) ?? "")}
                  error={errors[field.key]}
                  placeholder={field.placeholder}
                  onChange={(event) => {
                    const next = field.clean
                      ? field.clean(event.currentTarget.value)
                      : event.currentTarget.value;
                    setForm((prev) => ({ ...prev, [field.key]: next }));
                    setErrors((prev) => ({ ...prev, [field.key]: undefined }));
                  }}
                />
              ) : (
                <ReadOnlyValue>
                  {String(record?.[field.key] || "").trim() || DASH}
                </ReadOnlyValue>
              )}
            </Field>
          ))}
        </Grid>

        <Alert
          variant="light"
          color="blue"
          radius="md"
          icon={<Info size={18} />}
          mt="md"
        >
          <Text size="sm">
            Keep this the account in your own name. Payments fail if the name on
            the account does not match your records.
          </Text>
        </Alert>
      </SectionCard>
    </Stack>
  );
}

BankDetailsComponent.propTypes = {
  record: PropTypes.shape({
    bank_name: PropTypes.string,
    bank_account_no: PropTypes.string,
    ifsc_code: PropTypes.string,
  }),
  onSaved: PropTypes.func.isRequired,
};

BankDetailsComponent.defaultProps = { record: null };

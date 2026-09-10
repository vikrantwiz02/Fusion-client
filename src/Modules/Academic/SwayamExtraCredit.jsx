import React, { useState, useEffect } from "react";
import { Alert, Button, Tabs, Text, Loader, Center } from "@mantine/core";
import axios from "axios";
import {
  swayamRegistrationRoute,
  swayamRegistrationSubmitRoute,
} from "../../routes/academicRoutes";
import { courseLabel } from "../../lib/course";
import SlotCard from "./components/SlotCard";
import SlotRow from "./components/SlotRow";
import SlotSelect from "./components/SlotSelect";
import SwayamYourRequests from "./SwayamYourRequests";

export default function SwayamExtraCredit({
  showOnlyForm = false,
  onSubmitSuccess,
  refreshKey = 0,
}) {
  const [activeTab, setActiveTab] = useState("submit");
  const [courseSlots, setCourseSlots] = useState([]);
  const [choicesSelections, setChoicesSelections] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchAvailableSlots();
  }, [refreshKey]);

  const fetchAvailableSlots = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(swayamRegistrationRoute, {
        headers: { Authorization: `Token ${token}` },
      });

      if (Array.isArray(response.data) && response.data.length === 0) {
        setCourseSlots([]);
        setSuccessMessage("All available Swayam slots have been registered!");
        setHasPendingRequest(false);
      } else if (Array.isArray(response.data)) {
        setCourseSlots(response.data);
        setHasPendingRequest(response.data.has_pending_request || false);
      } else {
        setCourseSlots([]);
        setHasPendingRequest(false);
      }
    } catch (err) {
      const errorData = err?.response?.data;
      const errorMsg = errorData?.error || "Failed to load course data.";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // A course picked in one slot must not be offered in the others.
  const coursesTakenElsewhere = (slotId) =>
    new Set(
      Object.entries(choicesSelections)
        .filter(([sno, value]) => String(sno) !== String(slotId) && value)
        .map(([, value]) => String(value)),
    );

  const handleChoiceChange = (slotId, value) => {
    setChoicesSelections((prev) => ({ ...prev, [slotId]: value }));
  };

  const isFormComplete = () =>
    courseSlots.some(
      (slot) =>
        choicesSelections[slot.sno] && choicesSelections[slot.sno] !== "",
    );

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    const total = courseSlots.reduce((sum, slot) => {
      const selectedCourseIdStr = choicesSelections[slot.sno];
      if (selectedCourseIdStr) {
        const selectedCourseId = parseInt(selectedCourseIdStr, 10);
        const course = slot.course_choices.find(
          (c) => c.id === selectedCourseId,
        );
        if (course) {
          return sum + course.credits;
        }
      }
      return sum;
    }, 0);

    const registrations = courseSlots
      .filter(
        (slot) =>
          choicesSelections[slot.sno] && choicesSelections[slot.sno] !== "",
      )
      .map((slot) => ({
        slot_id: slot.sno,
        course_id: parseInt(choicesSelections[slot.sno], 10),
        selected_option: choicesSelections[slot.sno],
        remark: "Extra Credits",
      }));

    const payload = { registrations, totalCredits: total };

    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please login again.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        swayamRegistrationSubmitRoute,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        },
      );

      if (response.status === 201 || response.status === 200) {
        setSuccessMessage(
          `Successfully submitted ${registrations.length} Swayam course(s) for approval! Your request is pending Academic Admin review.`,
        );
        setChoicesSelections({});
        await fetchAvailableSlots();

        if (onSubmitSuccess) {
          setTimeout(() => onSubmitSuccess(), 1500);
        }
      }
    } catch (postError) {
      const errorData = postError?.response?.data;
      if (errorData?.error) {
        setError(errorData.error);
      } else if (errorData?.errors && Array.isArray(errorData.errors)) {
        setError(`Registration failed: ${errorData.errors.join(", ")}`);
      } else {
        setError("Registration submission failed. Please try again.");
      }
      await fetchAvailableSlots();
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <>
      {initialLoad ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
          }}
        >
          <Loader size="lg" />
        </div>
      ) : (
        <>
          <Alert color="blue" mb="md" variant="light">
            <Text size="sm">
              To replace an elective course from a previous semester, use the{" "}
              <strong>Replace</strong> tab.
            </Text>
          </Alert>

          {hasPendingRequest && !error && (
            <Alert
              color="yellow"
              mb="md"
              withCloseButton
              onClose={() => setHasPendingRequest(false)}
            >
              <Text fw={500}>
                You have a pending Extra Credit request. You can continue to
                register for other available slots.
              </Text>
            </Alert>
          )}

          {error ? (
            <Alert
              color="red"
              mb="md"
              withCloseButton
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          ) : loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : courseSlots.length === 0 ? (
            <Alert color={successMessage ? "teal" : "blue"} mb="md">
              {successMessage ||
                "No Swayam slots available for Extra Credit registration."}
            </Alert>
          ) : (
            <>
              {successMessage && (
                <Alert
                  color="green"
                  mb="md"
                  withCloseButton
                  onClose={() => setSuccessMessage(null)}
                >
                  {successMessage}
                </Alert>
              )}

              {courseSlots.map((slot) => (
                <SlotCard
                  key={slot.sno}
                  name={slot.slot_name}
                  meta={`${slot.slot_type} · Semester ${slot.semester}`}
                >
                  <SlotRow
                    primary="Course"
                    control={
                      <SlotSelect
                        label={`Course for ${slot.slot_name}`}
                        placeholder="Select course"
                        value={choicesSelections[slot.sno]}
                        onChange={(value) =>
                          handleChoiceChange(slot.sno, value)
                        }
                        options={slot.course_choices
                          .filter(
                            (course) =>
                              course.id !== undefined && course.id !== null,
                          )
                          .filter(
                            (course) =>
                              !coursesTakenElsewhere(slot.sno).has(
                                String(course.id),
                              ),
                          )
                          .map((course) => ({
                            value: String(course.id),
                            label: `${courseLabel(course)} (${course.credits} credits)`,
                          }))}
                      />
                    }
                  />
                </SlotCard>
              ))}

              <Button
                mt="xl"
                fullWidth
                styles={{ label: { whiteSpace: "normal" } }}
                onClick={handleSubmit}
                disabled={!isFormComplete() || submitting}
                loading={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Extra Credit Registration"}
              </Button>
            </>
          )}
        </>
      )}
    </>
  );

  if (showOnlyForm) {
    return formContent;
  }

  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="submit">Register Extra Credit</Tabs.Tab>
        <Tabs.Tab value="requests">Your Requests</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="submit" pt="md">
        {formContent}
      </Tabs.Panel>

      <Tabs.Panel value="requests" pt="md">
        <SwayamYourRequests requestType="Extra_Credits" />
      </Tabs.Panel>
    </Tabs>
  );
}

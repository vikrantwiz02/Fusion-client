import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Box, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import axios from "axios";
import tabClasses from "../../ui/styles/tabs.module.css";
import { swayamAvailabilityRoute } from "../../routes/academicRoutes";
import SwayamExtraCredit from "./SwayamExtraCredit";
import SwayamReplace from "./SwayamReplace";
import SwayamYourRequests from "./SwayamYourRequests";

function SwayamRegistrationWrapper() {
  const compact = useMediaQuery("(max-width: 575px)");
  const [activeMainTab, setActiveMainTab] = useState("extra");
  const [activeRequestsTab, setActiveRequestsTab] = useState("replace");
  const [refreshKey, setRefreshKey] = useState(0);
  const [availability, setAvailability] = useState(null);

  const loadAvailability = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const { data } = await axios.get(swayamAvailabilityRoute, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!data?.error) setAvailability(data);
    } catch {
      setAvailability(null);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability, refreshKey]);

  // The two paths draw on the same Swayam slots, so once one has taken them
  // the other has nothing left to offer. A replacement needs two.
  // Only gate when the semester actually has Swayam slots; otherwise let the
  // panels say why themselves rather than claiming the slots were spent.
  const gating = Boolean(availability?.applicable);
  const replaceClosed = gating && !availability.can_replace;
  const extraClosed = gating && !availability.can_extra_credit;
  const closedReason = (needed) => {
    if (!availability) return "";
    const { free_slots: free, used_extra_credits: extra, used_replace: repl } =
      availability;
    const spentOn = extra > 0 ? "extra credits" : "a replacement request";
    if (free === 0)
      return `All your Swayam slots are already used${extra || repl ? ` for ${spentOn}` : ""}.`;
    return `Only ${free} Swayam slot is free, and this needs ${needed}.`;
  };

  // Never leave the student sitting on a tab that has nothing to offer.
  useEffect(() => {
    if (activeMainTab === "extra" && extraClosed) {
      setActiveMainTab(replaceClosed ? "requests" : "replace");
    } else if (activeMainTab === "replace" && replaceClosed) {
      setActiveMainTab(extraClosed ? "requests" : "extra");
    }
  }, [activeMainTab, replaceClosed, extraClosed]);

  const handleTabChange = (value) => {
    if (value === "replace" && replaceClosed) return;
    if (value === "extra" && extraClosed) return;
    setActiveMainTab(value);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRequestsSubTabChange = (value) => {
    setActiveRequestsTab(value);
    setRefreshKey((prev) => prev + 1);
  };

  const handleSubmitSuccess = (requestType) => {
    setActiveMainTab("requests");
    setActiveRequestsTab(requestType === "replace" ? "replace" : "extra");
    setRefreshKey((prev) => prev + 1);
  };

  return (
    /* Card wrapper */
    <Box
      style={{
        border: "1px solid #dde3ea",
        borderRadius: 10,
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <Tabs
        value={activeMainTab}
        onChange={handleTabChange}
        variant="pills"
        color="blue"
        keepMounted={false}
      >
        {/* Main Tab Bar */}
        <Box
          px={{ base: "xs", sm: "md" }}
          py="xs"
          style={{
            background: "#f4f7fb",
            borderBottom: "1px solid #e6eaef",
          }}
        >
          <Tabs.List className={tabClasses.list}>
            <Tooltip label={closedReason(1)} disabled={!extraClosed}>
              <Tabs.Tab
                value="extra"
                className={tabClasses.tab}
                disabled={extraClosed}
              >
                {compact ? "Extra" : "Extra Credits"}
              </Tabs.Tab>
            </Tooltip>
            <Tooltip label={closedReason(2)} disabled={!replaceClosed}>
              <Tabs.Tab
                value="replace"
                className={tabClasses.tab}
                disabled={replaceClosed}
              >
                Replace
              </Tabs.Tab>
            </Tooltip>
            <Tabs.Tab value="requests" className={tabClasses.tab}>
              {compact ? "Requests" : "Your Requests"}
            </Tabs.Tab>
          </Tabs.List>
        </Box>

        {/* Replace Panel */}
        <Tabs.Panel value="replace">
          <Box p={{ base: "md", sm: "xl" }} style={{ background: "#fff" }}>
            <SwayamReplace
              showOnlyForm
              onSubmitSuccess={() => handleSubmitSuccess("replace")}
              refreshKey={refreshKey}
            />
          </Box>
        </Tabs.Panel>

        {/* Extra Credits Panel */}
        <Tabs.Panel value="extra">
          <Box p={{ base: "md", sm: "xl" }} style={{ background: "#fff" }}>
            <SwayamExtraCredit
              showOnlyForm
              onSubmitSuccess={() => handleSubmitSuccess("extra")}
              refreshKey={refreshKey}
            />
          </Box>
        </Tabs.Panel>

        {/* Your Requests Panel */}
        <Tabs.Panel value="requests" style={{ background: "#fff" }}>
          <Tabs
            value={activeRequestsTab}
            onChange={handleRequestsSubTabChange}
            variant="unstyled"
            keepMounted={false}
          >
            <Box
              style={{
                background: "#f8f9fa",
                borderBottom: "2px solid #dee2e6",
                padding: "0 12px",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <Tabs.List
                className={tabClasses.list}
                style={{ gap: 0, border: "none" }}
              >
                {[
                  { value: "replace", label: "Replacements" },
                  { value: "extra", label: "Extra credits" },
                ].map(({ value, label }) => {
                  const isActive = activeRequestsTab === value;
                  return (
                    <Tabs.Tab
                      key={value}
                      value={value}
                      className={tabClasses.tab}
                      style={{
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#228be6" : "#6c757d",
                        borderBottom: isActive
                          ? "2px solid #228be6"
                          : "2px solid transparent",
                        marginBottom: -2,
                        background: "transparent",
                        borderRadius: 0,
                      }}
                    >
                      {label}
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Box>

            <Tabs.Panel value="replace">
              <Box p={{ base: "md", sm: "lg" }} style={{ background: "#fff" }}>
                <SwayamYourRequests
                  requestType="Swayam_Replace"
                  refreshKey={refreshKey}
                />
              </Box>
            </Tabs.Panel>

            <Tabs.Panel value="extra">
              <Box p={{ base: "md", sm: "lg" }} style={{ background: "#fff" }}>
                <SwayamYourRequests
                  requestType="Extra_Credits"
                  refreshKey={refreshKey}
                />
              </Box>
            </Tabs.Panel>
          </Tabs>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

export default SwayamRegistrationWrapper;

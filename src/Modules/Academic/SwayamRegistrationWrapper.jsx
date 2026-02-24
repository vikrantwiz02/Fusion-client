import React, { useState } from "react";
import { Tabs, Box } from "@mantine/core";
import SwayamExtraCredit from "./SwayamExtraCredit";
import SwayamReplace from "./SwayamReplace";
import SwayamYourRequests from "./SwayamYourRequests";

function SwayamRegistrationWrapper() {
  const [activeMainTab, setActiveMainTab] = useState("replace");
  const [activeRequestsTab, setActiveRequestsTab] = useState("replace");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (value) => {
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
          style={{
            background: "#f1f5f9",
            borderBottom: "1px solid #dde3ea",
            padding: "10px 16px",
          }}
        >
          <Tabs.List style={{ gap: 6, flexWrap: "nowrap" }}>
            <Tabs.Tab
              value="replace"
              style={{
                fontWeight: activeMainTab === "replace" ? 700 : 500,
                fontSize: 14,
                padding: "9px 20px",
                borderRadius: 6,
              }}
            >
              Replace with Swayam
            </Tabs.Tab>
            <Tabs.Tab
              value="extra"
              style={{
                fontWeight: activeMainTab === "extra" ? 700 : 500,
                fontSize: 14,
                padding: "9px 20px",
                borderRadius: 6,
              }}
            >
              Extra Credits
            </Tabs.Tab>
            <Tabs.Tab
              value="requests"
              style={{
                fontWeight: activeMainTab === "requests" ? 700 : 500,
                fontSize: 14,
                padding: "9px 20px",
                borderRadius: 6,
              }}
            >
              Your Requests
            </Tabs.Tab>
          </Tabs.List>
        </Box>

        {/* Replace Panel */}
        <Tabs.Panel value="replace">
          <Box p="xl" style={{ background: "#fff" }}>
            <SwayamReplace
              showOnlyForm
              onSubmitSuccess={() => handleSubmitSuccess("replace")}
              refreshKey={refreshKey}
            />
          </Box>
        </Tabs.Panel>

        {/* Extra Credits Panel */}
        <Tabs.Panel value="extra">
          <Box p="xl" style={{ background: "#fff" }}>
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
                padding: "0 28px",
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <Tabs.List style={{ gap: 0, border: "none" }}>
                {[
                  { value: "replace", label: "Replacement Requests" },
                  { value: "extra",   label: "Extra Credit Requests" },
                ].map(({ value, label }) => {
                  const isActive = activeRequestsTab === value;
                  return (
                    <Tabs.Tab
                      key={value}
                      value={value}
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#228be6" : "#6c757d",
                        padding: "10px 20px",
                        borderBottom: isActive
                          ? "2px solid #228be6"
                          : "2px solid transparent",
                        marginBottom: -2,
                        background: "transparent",
                        borderRadius: 0,
                        cursor: "pointer",
                        transition: "color 0.15s, border-color 0.15s",
                      }}
                    >
                      {label}
                    </Tabs.Tab>
                  );
                })}
              </Tabs.List>
            </Box>

            <Tabs.Panel value="replace">
              <Box p="lg" style={{ background: "#fff" }}>
                <SwayamYourRequests
                  requestType="Swayam_Replace"
                  refreshKey={refreshKey}
                />
              </Box>
            </Tabs.Panel>

            <Tabs.Panel value="extra">
              <Box p="lg" style={{ background: "#fff" }}>
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


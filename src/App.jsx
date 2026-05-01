import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Notifications } from "@mantine/notifications";
import { Layout } from "./components/layout";
import Dashboard from "./Modules/Dashboard/dashboardNotifications";
import Profile from "./Modules/Dashboard/StudentProfile/profilePage";
import LoginPage from "./pages/login";
import AcademicPage from "./Modules/Academic/index";
import ValidateAuth from "./helper/validateauth";
import FacultyProfessionalProfile from "./Modules/facultyProfessionalProfile/facultyProfessionalProfile";
import InactivityHandler from "./helper/inactivityhandler";
import Examination from "./Modules/Examination/examination";
import Database from "./Modules/Database/database";
import ProgrammeCurriculumRoutes from "./Modules/Program_curriculum/programmCurriculum";
import NotFoundPage from "./components/NotFoundPage";
import PlacementCell from "./Modules/PlacementCell/index";

const theme = createTheme({
  breakpoints: {
    xxs: "300px",
    xs: "375px",
    sm: "768px",
    md: "992px",
    lg: "1200px",
    xl: "1408px",
  },
});

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const tokenKey = "authToken";
    const localToken = localStorage.getItem(tokenKey);
    const sessionToken = sessionStorage.getItem(tokenKey);
    const canUseBroadcastChannel = typeof BroadcastChannel !== "undefined";
    const channel = canUseBroadcastChannel
      ? new BroadcastChannel("fusion-auth-session")
      : null;

    let pendingRequestId = null;
    let receivedSessionAck = false;
    let checkTimer = null;

    const onMessage = (event) => {
      const message = event?.data;
      if (!message) return;

      if (
        message.type === "SESSION_CHECK" &&
        sessionStorage.getItem(tokenKey) &&
        channel
      ) {
        channel.postMessage({
          type: "SESSION_ACTIVE",
          requestId: message.requestId,
        });
      }

      if (
        message.type === "SESSION_ACTIVE" &&
        pendingRequestId &&
        message.requestId === pendingRequestId
      ) {
        receivedSessionAck = true;
        const currentLocalToken = localStorage.getItem(tokenKey);
        if (currentLocalToken) {
          sessionStorage.setItem(tokenKey, currentLocalToken);
        }
      }
    };

    if (channel) {
      channel.addEventListener("message", onMessage);
    }

    // Keep token reads backward-compatible for existing API calls that still
    // fetch authToken from localStorage.
    if (!localToken && sessionToken) {
      localStorage.setItem(tokenKey, sessionToken);
    }

    // If token exists only in localStorage, verify whether another active tab
    // can confirm the same browser session; otherwise invalidate stale token.
    if (localToken && !sessionToken) {
      if (channel) {
        pendingRequestId = `${Date.now()}-${Math.random()}`;
        channel.postMessage({ type: "SESSION_CHECK", requestId: pendingRequestId });

        checkTimer = setTimeout(() => {
          if (!receivedSessionAck) {
            localStorage.removeItem(tokenKey);
            sessionStorage.removeItem(tokenKey);
          }
        }, 400);
      } else {
        localStorage.removeItem(tokenKey);
        sessionStorage.removeItem(tokenKey);
      }
    }

    return () => {
      if (checkTimer) clearTimeout(checkTimer);
      if (channel) {
        channel.removeEventListener("message", onMessage);
        channel.close();
      }
    };
  }, []);

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-center" autoClose={2000} limit={1} />
      {location.pathname !== "/accounts/login" && location.pathname !== "/reset-password" && <ValidateAuth />}
      {location.pathname !== "/accounts/login" && location.pathname !== "/reset-password" && <InactivityHandler />}

      <Routes>
        <Route path="/" element={<Navigate to="/accounts/login" replace />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/academics"
          element={
            <Layout>
              <AcademicPage />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
        <Route
          path="/facultyprofessionalprofile/*"
          element={
            <Layout>
              <FacultyProfessionalProfile />
            </Layout>
          }
        />
        <Route
          path="/programme_curriculum/*"
          element={
            <div>
              <ProgrammeCurriculumRoutes />
            </div>
          }
        />
        <Route
          path="/placement-cell"
          element={
            <Layout>
              <PlacementCell />
            </Layout>
          }
        />
        <Route path="/accounts/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<Navigate to="/accounts/login" replace />} />
        <Route path="/examination/*" element={<Examination />} />
        <Route path="/database/*" element={<Database />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MantineProvider>
  );
}

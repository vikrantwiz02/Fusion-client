import React, { useState, useEffect } from "react";
import { Table, Alert, Badge, Text, Loader, Center } from "@mantine/core";
import axios from "axios";
import { studentSwayamRequestsRoute } from "../../routes/academicRoutes";

export default function SwayamYourRequests({ requestType, refreshKey = 0 }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [requestType, refreshKey]);

  const fetchRequests = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(studentSwayamRequestsRoute, {
        params: { request_type: requestType },
        headers: { Authorization: `Token ${token}` },
      });
      setRequests(response.data.requests || []);
    } catch (err) {
      const errorMsg = err?.response?.data?.error || "Failed to load requests.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (requests.length === 0) {
    return (
      <Alert color="blue" mb="md">
        No {requestType === "Swayam_Replace" ? "replacement" : "extra credit"} requests found.
      </Alert>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "yellow";
      case "Approved":
        return "green";
      case "Rejected":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div>
      <Text size="md" weight={600} mb="md" color="#3B82F6">
        Your {requestType === "Swayam_Replace" ? "Replacement" : "Extra Credit"} Requests
      </Text>
      
      <div style={{ overflowX: "auto" }}>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Request Date</th>
              {requestType === "Swayam_Replace" && <th>Source Course</th>}
              <th>Target Course</th>
              <th>Target Slot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>
                  <Text size="xs">{new Date(req.submitted_at).toLocaleDateString()}</Text>
                </td>
                {requestType === "Swayam_Replace" && (
                  <td>
                    <Text size="xs">
                      {req.old_course ? `${req.old_course.code} - ${req.old_course.name}` : 'N/A'}
                    </Text>
                  </td>
                )}
                <td>
                  <Text size="xs">
                    {req.new_course.code} - {req.new_course.name}
                  </Text>
                </td>
                <td>{req.slot.name}</td>
                <td>
                  <Badge color={getStatusColor(req.status)}>{req.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

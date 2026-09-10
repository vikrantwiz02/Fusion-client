import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentCreditSummary from "./StudentCreditSummary";
import { theme } from "../../ui/theme/theme";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

const SEMESTERS = [
  {
    label: "Semester 1",
    courses: [{ code: "CS1010", credits: 20, grade: "A", remark: "Regular" }],
  },
  {
    label: "Semester 2",
    courses: [
      { code: "CS2010", credits: 14, grade: "A", remark: "Regular" },
      { code: "SW2001", credits: 2, grade: "A", remark: "Regular" },
    ],
  },
];

function renderPanel() {
  return render(
    <MantineProvider theme={theme}>
      <StudentCreditSummary />
    </MantineProvider>,
  );
}

describe("StudentCreditSummary", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    axios.get.mockReset();
  });

  it("labels each tile for both wide and narrow screens", async () => {
    axios.get.mockResolvedValue({ data: { semesters: SEMESTERS } });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Credits Details")).toBeInTheDocument(),
    );

    const tiles = within(screen.getByTestId("credit-tiles"));
    ["Credits Earned", "Regular Credits", "Backlog / Improvement"].forEach(
      (full) => expect(tiles.getByText(full)).toBeInTheDocument(),
    );
    ["Earned", "Regular", "Backlog", "Swayam"].forEach((short) =>
      expect(tiles.getByText(short)).toBeInTheDocument(),
    );
  });

  it("totals the credits and states the degree requirement", async () => {
    axios.get.mockResolvedValue({
      data: { semesters: SEMESTERS, programme_category: "UG" },
    });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Credits Details")).toBeInTheDocument(),
    );

    expect(screen.getAllByText("36").length).toBeGreaterThan(0);
    expect(screen.getAllByText("34").length).toBeGreaterThan(0);
    // fixture swayam is 2, within the cap, so the whole earned total counts
    expect(screen.getByText("112")).toBeInTheDocument();
    expect(screen.getByText("148 − 36")).toBeInTheDocument();
  });

  it("omits the degree requirement for a postgraduate student", async () => {
    axios.get.mockResolvedValue({
      data: { semesters: SEMESTERS, programme_category: "PG" },
    });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Credits Details")).toBeInTheDocument(),
    );

    // the credit table still renders
    expect(screen.getAllByText("36").length).toBeGreaterThan(0);
    // but the undergraduate degree rule does not
    expect(screen.queryByText("148 − 36")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Remaining Credits requirement for degree"),
    ).not.toBeInTheDocument();
  });

  it("shows the same semesters in the table and the narrow-screen list", async () => {
    axios.get.mockResolvedValue({ data: { semesters: SEMESTERS } });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Credits Details")).toBeInTheDocument(),
    );

    ["Semester 1", "Semester 2"].forEach((label) => {
      expect(screen.getAllByText(label)).toHaveLength(2);
    });
    expect(screen.getAllByText("Total")).toHaveLength(2);
  });

  it("does not render student identity fields", async () => {
    axios.get.mockResolvedValue({ data: { semesters: SEMESTERS } });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Credits Details")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Roll No.")).not.toBeInTheDocument();
    expect(screen.queryByText("Discipline")).not.toBeInTheDocument();
  });

  it("explains itself when nothing is announced yet", async () => {
    axios.get.mockResolvedValue({ data: { semesters: [] } });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("No credits to show yet")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Credits Details")).not.toBeInTheDocument();
  });

  it("surfaces a failed request instead of rendering empty", async () => {
    axios.get.mockRejectedValue({
      response: { status: 500, data: { detail: "Server exploded" } },
    });
    renderPanel();

    await waitFor(() =>
      expect(screen.getByText("Server exploded")).toBeInTheDocument(),
    );
  });
});

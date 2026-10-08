import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { partners } from "@/data/partners";
import { sessions } from "@/data/store";
import { type SessionRow, SessionsTable } from "./sessions-table";

const rows: SessionRow[] = sessions.slice(0, 12).map((s) => ({
  ...s,
  country: partners.find((p) => p.id === s.partnerId)?.country ?? "US",
}));

function renderTable(overrides: Partial<Parameters<typeof SessionsTable>[0]> = {}) {
  const onOpen = vi.fn();
  const onPage = vi.fn();
  render(
    <SessionsTable
      rows={rows}
      total={70}
      page={1}
      pageCount={6}
      pageSize={12}
      partners={partners}
      onPage={onPage}
      onOpen={onOpen}
      {...overrides}
    />,
  );
  return { onOpen, onPage };
}

function bodyRows() {
  const [, body] = within(screen.getByRole("table")).getAllByRole("rowgroup");
  if (!body) throw new Error("Table body missing");
  return within(body).getAllByRole("row");
}

describe("SessionsTable", () => {
  it("renders a page of sessions with outcome and failure reason", () => {
    renderTable();
    expect(bodyRows()).toHaveLength(12);
    expect(screen.getByText("Showing 1 to 12 of 70 sessions")).toBeInTheDocument();
    const failed = rows.find((r) => r.outcome === "failed");
    if (failed?.failureReason === "face_not_detected") {
      expect(screen.getAllByText("Face not detected").length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("opens a session from its id and pages forward", async () => {
    const user = userEvent.setup();
    const { onOpen, onPage } = renderTable();
    const first = rows[0];
    if (!first) throw new Error("No rows");
    await user.click(screen.getByRole("button", { name: `Open session ${first.id}` }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: first.id }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it("shows an empty state when nothing matches", () => {
    renderTable({ rows: [], total: 0, page: 1, pageCount: 1 });
    expect(screen.getByText(/No sessions match these filters/)).toBeInTheDocument();
    expect(screen.getByText("Showing 0 to 0 of 0 sessions")).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { accounts } from "@/data/accounts";
import { AccountsTable } from "./accounts-table";

// The table links to the detail route; swap the router Link for a plain anchor in unit tests.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode;
    to: string;
    params: Record<string, string>;
  }) => <a href={props.to}>{children}</a>,
}));

function bodyRows() {
  const table = screen.getByRole("table");
  const [, body] = within(table).getAllByRole("rowgroup");
  if (!body) throw new Error("Table body missing");
  return within(body).getAllByRole("row");
}

describe("AccountsTable", () => {
  it("renders every account sorted by name", () => {
    render(<AccountsTable accounts={accounts} />);
    const rows = bodyRows();
    expect(rows).toHaveLength(accounts.length);
    expect(rows[0]).toHaveTextContent("Fleet Fuel Card");
    expect(
      screen.getByText(`Showing ${accounts.length} of ${accounts.length} accounts`),
    ).toBeInTheDocument();
  });

  it("filters by text and shows an empty state", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={accounts} />);
    const filter = screen.getByLabelText("Filter accounts");

    await user.type(filter, "savings");
    expect(bodyRows()).toHaveLength(2);

    await user.clear(filter);
    await user.type(filter, "zzz");
    expect(screen.getByText(/No accounts match/)).toBeInTheDocument();
  });

  it("sorts by balance when the header is clicked", async () => {
    const user = userEvent.setup();
    render(<AccountsTable accounts={accounts} />);
    const header = screen.getByRole("button", { name: "Balance" });

    // Numeric columns sort descending first: the largest balance leads.
    await user.click(header);
    expect(header.closest("th")).toHaveAttribute("aria-sort", "descending");
    expect(bodyRows()[0]).toHaveTextContent("Harbor Reserve");

    await user.click(header);
    expect(header.closest("th")).toHaveAttribute("aria-sort", "ascending");
    expect(bodyRows()[0]).toHaveTextContent("Legacy Merchant");
  });
});

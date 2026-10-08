import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiStrip } from "./kpi-strip";

const kpis = { sessions: 32_015, completionRate: 0.695, clickRate: 0.322, conversionUplift: 1.74 };

describe("KpiStrip", () => {
  it("formats the four tiles without deltas when there is no previous window", () => {
    render(<KpiStrip kpis={kpis} previous={null} rangeDays={28} />);
    expect(screen.getByText("32,015")).toBeInTheDocument();
    expect(screen.getByText("69.5%")).toBeInTheDocument();
    expect(screen.getByText("32.2%")).toBeInTheDocument();
    expect(screen.getByText("+174%")).toBeInTheDocument();
    expect(screen.getByText("Last 28 days")).toBeInTheDocument();
    expect(screen.queryByText(/vs previous/)).not.toBeInTheDocument();
  });

  it("shows signed deltas against the previous window", () => {
    const previous = { ...kpis, sessions: 32_570, completionRate: 0.7, clickRate: 0.32 };
    render(<KpiStrip kpis={kpis} previous={previous} rangeDays={14} />);
    expect(screen.getByText("-1.7%")).toBeInTheDocument();
    expect(screen.getByText("-0.7%")).toBeInTheDocument();
    expect(screen.getByText("+0.6%")).toBeInTheDocument();
    expect(screen.getAllByText(/vs previous 14 days/)).toHaveLength(4);
  });
});

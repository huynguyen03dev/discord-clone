import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUseSocket = vi.fn();

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: () => mockUseSocket(),
}));

import { SocketIndicator } from "@/components/socket-indicator";

describe("SocketIndicator", () => {
  it("shows live text with green badge when connected", () => {
    mockUseSocket.mockReturnValue({ isConnected: true });

    render(<SocketIndicator />);

    const badge = screen.getByText(/live/i);
    expect(badge).toBeVisible();
    expect(badge).toHaveClass("bg-emerald-600");
  });

  it("shows polling text with yellow badge when disconnected", () => {
    mockUseSocket.mockReturnValue({ isConnected: false });

    render(<SocketIndicator />);

    const badge = screen.getByText(/polling/i);
    expect(badge).toBeVisible();
    expect(badge).toHaveClass("bg-yellow-600");
  });
});

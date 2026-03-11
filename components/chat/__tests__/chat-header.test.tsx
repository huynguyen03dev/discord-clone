import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/render";
import { vi } from "vitest";
import { ChatHeader } from "../chat-header";

vi.mock("@/components/mobile-toggle", () => ({
  MobileToggle: ({ serverId }: { serverId: string }) => (
    <button data-testid="mobile-toggle" data-server-id={serverId}>
      Menu
    </button>
  ),
}));

vi.mock("@/components/socket-indicator", () => ({
  SocketIndicator: () => <div data-testid="socket-indicator" />,
}));

vi.mock("@/components/user-avatar", () => ({
  UserAvatar: ({ src, className }: { src?: string; className?: string }) => (
    <img data-testid="user-avatar" src={src} className={className} alt="avatar" />
  ),
}));

describe("ChatHeader", () => {
  it("renders channel name with Hash icon", () => {
    renderWithProviders(
      <ChatHeader
        name="general"
        type="channel"
        serverId="server-1"
      />
    );

    expect(screen.getByText("general")).toBeInTheDocument();
  });

  it("renders mobile toggle button", () => {
    renderWithProviders(
      <ChatHeader
        name="general"
        type="channel"
        serverId="server-1"
      />
    );

    expect(screen.getByTestId("mobile-toggle")).toBeInTheDocument();
  });

  it("renders user avatar for conversation type", () => {
    renderWithProviders(
      <ChatHeader
        name="John Doe"
        type="conversation"
        serverId="server-1"
        imageUrl="https://example.com/avatar.png"
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
  });
});

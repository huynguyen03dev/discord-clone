import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChannelType, MemberRole } from "@prisma/client";
import { ServerChannel } from "../server-channel";
import { channelFixture } from "@/test-utils/fixtures";

vi.mock("@/components/action-tooltip", () => ({
  ActionTooltip: ({ children }: any) => children,
}));

vi.mock("@/hooks/use-modal-store", () => ({
  useModal: () => ({ onOpen: vi.fn() }),
}));

vi.mock("lucide-react", () => ({
  Hash: (props: any) => <span data-testid="hash-icon" {...props} />,
  Mic: (props: any) => <span data-testid="mic-icon" {...props} />,
  Video: (props: any) => <span data-testid="video-icon" {...props} />,
  Edit: (props: any) => <span data-testid="edit-icon" {...props} />,
  Trash: (props: any) => <span data-testid="trash-icon" {...props} />,
  Lock: (props: any) => <span data-testid="lock-icon" {...props} />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: vi.fn().mockReturnValue({}),
  usePathname: vi.fn().mockReturnValue(""),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("ServerChannel", () => {
  it("renders channel name with Hash icon for TEXT type", () => {
    const channel = { ...channelFixture, type: ChannelType.TEXT };
    render(<ServerChannel channel={channel} role={MemberRole.ADMIN} />);
    expect(screen.getByText(channel.name)).toBeInTheDocument();
    expect(screen.getByTestId("hash-icon")).toBeInTheDocument();
  });

  it("renders channel name with Mic icon for AUDIO type", () => {
    const channel = {
      ...channelFixture,
      name: "voice-chat",
      type: ChannelType.AUDIO,
    };
    render(<ServerChannel channel={channel} role={MemberRole.ADMIN} />);
    expect(screen.getByText("voice-chat")).toBeInTheDocument();
    expect(screen.getByTestId("mic-icon")).toBeInTheDocument();
  });

  it("renders channel name with Video icon for VIDEO type", () => {
    const channel = {
      ...channelFixture,
      name: "video-chat",
      type: ChannelType.VIDEO,
    };
    render(<ServerChannel channel={channel} role={MemberRole.ADMIN} />);
    expect(screen.getByText("video-chat")).toBeInTheDocument();
    expect(screen.getByTestId("video-icon")).toBeInTheDocument();
  });
});

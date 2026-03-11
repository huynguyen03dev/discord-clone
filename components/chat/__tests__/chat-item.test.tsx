import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils/render";
import { vi } from "vitest";
import { FileKind, MemberRole } from "@prisma/client";
import { ChatItem } from "../chat-item";
import {
  memberFixture,
  profileFixture,
} from "@/test-utils/fixtures";

vi.mock("next/dynamic", () => {
  return {
    default: (loader: () => Promise<any>) => {
      let Resolved: any = null;
      loader().then((mod: any) => {
        Resolved = mod.default || mod;
      });
      return function DynamicWrapper(props: any) {
        if (!Resolved) {
          const React = require("react");
          const [, forceUpdate] = React.useState(0);
          React.useEffect(() => {
            loader().then((mod: any) => {
              Resolved = mod.default || mod;
              forceUpdate((n: number) => n + 1);
            });
          }, []);
          return null;
        }
        return <Resolved {...props} />;
      };
    },
  };
});

vi.mock("@/hooks/use-modal-store", () => ({
  useModal: () => ({
    onOpen: vi.fn(),
    onClose: vi.fn(),
    isOpen: false,
    type: null,
    data: {},
  }),
}));

vi.mock("@/components/user-avatar", () => ({
  UserAvatar: ({ src }: { src?: string }) => (
    <img data-testid="user-avatar" src={src} alt="avatar" />
  ),
}));

vi.mock("@/components/action-tooltip", () => ({
  ActionTooltip: ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`tooltip-${label}`}>
      {children}
    </div>
  ),
}));

vi.mock("../chat-item-edit-form", () => ({
  default: ({
    content,
    onCancel,
  }: {
    content: string;
    id: string;
    socketUrl: string;
    socketQuery: Record<string, string>;
    onCancel: () => void;
  }) => (
    <div data-testid="edit-form">
      <input defaultValue={content} data-testid="edit-input" />
      <button onClick={onCancel} data-testid="cancel-edit">
        Cancel
      </button>
    </div>
  ),
}));

const memberWithProfile = {
  ...memberFixture,
  profile: profileFixture,
};

const anotherMember = {
  ...memberFixture,
  id: "another-member-id",
  role: MemberRole.GUEST,
  profile: {
    ...profileFixture,
    id: "another-profile-id",
    name: "Other User",
    imageUrl: "https://example.com/other-avatar.png",
  },
};

const defaultProps = {
  id: "msg-1",
  content: "Hello, world!",
  currentMember: memberFixture,
  member: memberWithProfile,
  timestamp: "01/01/2024 12:00 PM",
  fileUrl: null,
  fileName: null,
  fileMimeType: null,
  fileSize: null,
  fileKind: null,
  deleted: false,
  isUpdated: false,
  socketUrl: "/api/socket/messages",
  socketQuery: { channelId: "ch-1", serverId: "sv-1" },
};

describe("ChatItem", () => {
  it("renders member avatar, name, content, and timestamp", () => {
    renderWithProviders(<ChatItem {...defaultProps} />);

    expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
    expect(screen.getByText("01/01/2024 12:00 PM")).toBeInTheDocument();
  });

  it("shows edit form with pre-filled content when owner clicks edit", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ChatItem {...defaultProps} />);

    const editButton = screen.getByTestId("tooltip-Edit").querySelector("svg");
    expect(editButton).toBeInTheDocument();

    await user.click(editButton!);

    await waitFor(() => {
      expect(screen.getByTestId("edit-form")).toBeInTheDocument();
    });

    expect(screen.getByTestId("edit-input")).toHaveValue("Hello, world!");
  });

  it("shows 'This message has been deleted.' in italic for deleted messages with no edit/delete actions", () => {
    renderWithProviders(
      <ChatItem {...defaultProps} deleted={true} content="This message has been deleted." />
    );

    const deletedText = screen.getByText("This message has been deleted.");
    expect(deletedText).toBeInTheDocument();
    expect(deletedText).toHaveClass("italic");

    expect(screen.queryByTestId("tooltip-Edit")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tooltip-Delete")).not.toBeInTheDocument();
  });

  it("renders image preview for IMAGE fileKind", () => {
    renderWithProviders(
      <ChatItem
        {...defaultProps}
        fileUrl="https://example.com/image.png"
        fileName="image.png"
        fileKind={FileKind.IMAGE}
      />
    );

    const image = screen.getByAltText("{content}");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.png");
  });

  it("renders download link for PDF fileKind", () => {
    renderWithProviders(
      <ChatItem
        {...defaultProps}
        fileUrl="https://example.com/doc.pdf"
        fileName="document.pdf"
        fileKind={FileKind.PDF}
      />
    );

    const link = screen.getByText("document.pdf");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "https://example.com/doc.pdf"
    );
  });
});

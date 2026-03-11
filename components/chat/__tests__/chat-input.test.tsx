import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils/render";
import { vi } from "vitest";
import axios from "axios";
import { ChatInput } from "../chat-input";
import { memberFixture, profileFixture } from "@/test-utils/fixtures";

vi.mock("axios", () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

vi.mock("@/hooks/use-modal-store", () => ({
  useModal: () => ({
    onOpen: vi.fn(),
    onClose: vi.fn(),
    isOpen: false,
    type: null,
    data: {},
  }),
}));

vi.mock("@/components/emoji-picker", () => ({
  EmojiPicker: ({ onChange }: { onChange: (emoji: string) => void }) => (
    <button data-testid="emoji-picker" onClick={() => onChange("😀")}>
      Emoji
    </button>
  ),
}));

const memberWithProfile = {
  ...memberFixture,
  profile: profileFixture,
};

describe("ChatInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input with placeholder 'Message #channelName' for channels", () => {
    renderWithProviders(
      <ChatInput
        name="general"
        type="channel"
        apiUrl="/api/messages"
        query={{ channelId: "ch-1", serverId: "sv-1" }}
        chatId="ch-1"
        member={memberWithProfile}
      />
    );

    expect(
      screen.getByPlaceholderText("Message #general")
    ).toBeInTheDocument();
  });

  it("renders input with placeholder 'Message memberName' for DMs", () => {
    renderWithProviders(
      <ChatInput
        name="John Doe"
        type="conversation"
        apiUrl="/api/direct-messages"
        query={{ conversationId: "conv-1" }}
        chatId="conv-1"
        member={memberWithProfile}
      />
    );

    expect(
      screen.getByPlaceholderText("Message John Doe")
    ).toBeInTheDocument();
  });

  it("handles message submission via axios POST and resets input", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ChatInput
        name="general"
        type="channel"
        apiUrl="/api/messages"
        query={{ channelId: "ch-1", serverId: "sv-1" }}
        chatId="ch-1"
        member={memberWithProfile}
      />
    );

    const input = screen.getByPlaceholderText("Message #general");
    await user.type(input, "Hello world");

    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/messages"),
        { content: "Hello world" }
      );
    });

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });
});

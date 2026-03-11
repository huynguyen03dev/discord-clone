import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { ChannelType } from "@prisma/client";
import { useModal } from "@/hooks/use-modal-store";
import { renderWithProviders } from "@/test-utils/render";
import { serverFixture, channelFixture } from "@/test-utils/fixtures";
import { EditServerModal } from "../edit-server-modal";
import { EditChannelModal } from "../edit-channel-modal";
import { DeleteChannelModal } from "../delete-channel-modal";
import { LeaveServerModal } from "../leave-server-modal";
import { MessageFileModal } from "../message-file-modal";
import { DeleteMessageModal } from "../delete-message-modal";

vi.mock("axios");
vi.mock("@/components/file-upload", () => ({
  default: ({ onChange, value }: { onChange: (url: string) => void; value: string }) => (
    <div data-testid="file-upload">
      <input
        data-testid="file-upload-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" data-testid="file-upload-set" onClick={() => onChange("https://example.com/file.png")}>
        Upload
      </button>
    </div>
  ),
}));

const mockRouter = { push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ serverId: "test-server-id" }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("EditServerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when closed", () => {
    renderWithProviders(<EditServerModal />);
    expect(screen.queryByText("Customize to the server")).not.toBeInTheDocument();
  });

  it("renders with server data and submits PATCH", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("editServer", { server: serverFixture });
    renderWithProviders(<EditServerModal />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(serverFixture.name)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Enter server name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Server");

    await user.click(screen.getByTestId("file-upload-set"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        `/api/servers/${serverFixture.id}`,
        expect.objectContaining({ name: "Updated Server" })
      );
    });
  });
});

describe("EditChannelModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when closed", () => {
    renderWithProviders(<EditChannelModal />);
    expect(screen.queryByText("Edit Channel")).not.toBeInTheDocument();
  });

  it("renders with channel data and submits PATCH", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("editChannel", { channel: channelFixture });
    renderWithProviders(<EditChannelModal />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(channelFixture.name)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("Enter channel name");
    await user.clear(nameInput);
    await user.type(nameInput, "updated-channel");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/channels/${channelFixture.id}`),
        expect.objectContaining({ name: "updated-channel" })
      );
    });
  });
});

describe("DeleteChannelModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when closed", () => {
    renderWithProviders(<DeleteChannelModal />);
    expect(screen.queryByText("Delete Channel")).not.toBeInTheDocument();
  });

  it("shows channel name and calls DELETE on confirm", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("deleteChannel", { channel: channelFixture });
    renderWithProviders(<DeleteChannelModal />);

    expect(screen.getByText(channelFixture.name)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining(`/api/channels/${channelFixture.id}`)
      );
    });
  });

  it("refreshes router on successful delete", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("deleteChannel", { channel: channelFixture });
    renderWithProviders(<DeleteChannelModal />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });
});

describe("LeaveServerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when closed", () => {
    renderWithProviders(<LeaveServerModal />);
    expect(screen.queryByText("Leave Server")).not.toBeInTheDocument();
  });

  it("shows server name and calls PATCH leave on confirm", async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("leaveServer", { server: serverFixture });
    renderWithProviders(<LeaveServerModal />);

    expect(screen.getByText(serverFixture.name)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(`/api/servers/${serverFixture.id}/leave`);
    });
  });

  it("redirects to root on successful leave", async () => {
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("leaveServer", { server: serverFixture });
    renderWithProviders(<LeaveServerModal />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });
});

describe("MessageFileModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when closed", () => {
    renderWithProviders(<MessageFileModal />);
    expect(screen.queryByText("Add an attachment")).not.toBeInTheDocument();
  });

  it("renders file upload form when open", () => {
    useModal.getState().onOpen("messageFile", {
      apiUrl: "/api/messages",
      query: { channelId: "ch1", serverId: "s1" },
    });
    renderWithProviders(<MessageFileModal />);

    expect(screen.getByText("Add an attachment")).toBeInTheDocument();
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();
  });

  it("submits file via API", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("messageFile", {
      apiUrl: "/api/messages",
      query: { channelId: "ch1", serverId: "s1" },
    });
    renderWithProviders(<MessageFileModal />);

    await user.click(screen.getByTestId("file-upload-set"));
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/messages"),
        expect.objectContaining({ fileUrl: "https://example.com/file.png" })
      );
    });
  });
});

describe("DeleteMessageModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when closed", () => {
    renderWithProviders(<DeleteMessageModal />);
    expect(screen.queryByText("Delete Message")).not.toBeInTheDocument();
  });

  it("shows confirmation and calls DELETE on confirm", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("deleteMessage", {
      apiUrl: "/api/messages/msg1",
      query: { channelId: "ch1" },
    });
    renderWithProviders(<DeleteMessageModal />);

    expect(screen.getByText("Delete Message")).toBeInTheDocument();
    expect(screen.getByText(/permanently deleted/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/messages/msg1")
      );
    });
  });

  it("closes modal on cancel", async () => {
    useModal.getState().onOpen("deleteMessage", {
      apiUrl: "/api/messages/msg1",
      query: { channelId: "ch1" },
    });
    renderWithProviders(<DeleteMessageModal />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(useModal.getState().isOpen).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { useModal } from "@/hooks/use-modal-store";
import { renderWithProviders } from "@/test-utils/render";
import { CreateChannelModal } from "../create-channel-modal";

vi.mock("axios");

const mockParams = { serverId: "test-server-id" };
const mockRouter = { push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => mockParams,
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("CreateChannelModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when modal is closed", () => {
    renderWithProviders(<CreateChannelModal />);
    expect(screen.queryByText("Customize to the server")).not.toBeInTheDocument();
  });

  it("renders with name and type fields when open", () => {
    useModal.getState().onOpen("createChannel");
    renderWithProviders(<CreateChannelModal />);

    expect(screen.getByPlaceholderText("Enter channel name")).toBeInTheDocument();
    expect(screen.getByText("Channel Type")).toBeInTheDocument();
  });

  it("submits form with name and type via POST /api/channels", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("createChannel");
    renderWithProviders(<CreateChannelModal />);

    await user.type(screen.getByPlaceholderText("Enter channel name"), "my-channel");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/channels"),
        expect.objectContaining({ name: "my-channel", type: "TEXT" })
      );
    });

    const callUrl = vi.mocked(axios.post).mock.calls[0][0] as string;
    expect(callUrl).toContain("serverId=test-server-id");
  });

  it("closes modal and refreshes router on successful submit", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("createChannel");
    renderWithProviders(<CreateChannelModal />);

    await user.type(screen.getByPlaceholderText("Enter channel name"), "my-channel");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(useModal.getState().isOpen).toBe(false);
    });
  });

  it("validates channel name cannot be 'general'", async () => {
    const user = userEvent.setup();
    useModal.getState().onOpen("createChannel");
    renderWithProviders(<CreateChannelModal />);

    await user.type(screen.getByPlaceholderText("Enter channel name"), "general");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByText('Channel name cannot be "general"')).toBeInTheDocument();
    });
    expect(axios.post).not.toHaveBeenCalled();
  });
});

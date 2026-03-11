import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { useModal } from "@/hooks/use-modal-store";
import { renderWithProviders } from "@/test-utils/render";
import { serverFixture } from "@/test-utils/fixtures";
import { DeleteServerModal } from "../delete-server-modal";

vi.mock("axios");

const mockRouter = { push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({}),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("DeleteServerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when modal is closed", () => {
    renderWithProviders(<DeleteServerModal />);
    expect(screen.queryByText("Delete Server")).not.toBeInTheDocument();
  });

  it("shows confirmation with server name", () => {
    useModal.getState().onOpen("deleteServer", { server: serverFixture });
    renderWithProviders(<DeleteServerModal />);

    expect(screen.getByText("Delete Server")).toBeInTheDocument();
    expect(screen.getByText(serverFixture.name)).toBeInTheDocument();
  });

  it("calls DELETE /api/servers/[serverId] on confirm", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("deleteServer", { server: serverFixture });
    renderWithProviders(<DeleteServerModal />);

    const confirmButton = screen.getByRole("button", { name: "Confirm" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(`/api/servers/${serverFixture.id}`);
    });
  });

  it("redirects to root and refreshes on successful delete", async () => {
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });
    useModal.getState().onOpen("deleteServer", { server: serverFixture });
    renderWithProviders(<DeleteServerModal />);

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("closes modal on cancel", async () => {
    useModal.getState().onOpen("deleteServer", { server: serverFixture });
    renderWithProviders(<DeleteServerModal />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(useModal.getState().isOpen).toBe(false);
    });
  });
});

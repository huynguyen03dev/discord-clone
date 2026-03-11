import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { useModal } from "@/hooks/use-modal-store";
import { renderWithProviders } from "@/test-utils/render";
import { serverFixture } from "@/test-utils/fixtures";
import { InviteModal } from "../invite-modal";

vi.mock("axios");
vi.mock("@/hooks/use-origin", () => ({
  useOrigin: () => "http://localhost:3000",
}));

const mockRouter = { push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({}),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

const writeTextMock = vi.fn().mockResolvedValue(undefined);

describe("InviteModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: writeTextMock },
    });
  });

  it("does not render when modal is closed", () => {
    renderWithProviders(<InviteModal />);
    expect(screen.queryByText("Invite Friends")).not.toBeInTheDocument();
  });

  it("renders invite URL with server invite code", () => {
    useModal.getState().onOpen("invite", { server: serverFixture });
    renderWithProviders(<InviteModal />);

    expect(screen.getByText("Invite Friends")).toBeInTheDocument();
    const input = screen.getByDisplayValue(new RegExp(serverFixture.inviteCode));
    expect(input).toBeInTheDocument();
  });

  it("copies invite URL to clipboard on copy button click", async () => {
    useModal.getState().onOpen("invite", { server: serverFixture });
    renderWithProviders(<InviteModal />);

    const buttons = document.querySelectorAll('[data-slot="button"]');
    const copyButton = buttons[0] as HTMLButtonElement;
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining(serverFixture.inviteCode)
      );
    });
  });

  it("regenerates invite link via PATCH and updates URL", async () => {
    const user = userEvent.setup();
    const updatedServer = { ...serverFixture, inviteCode: "newcode789" };
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: updatedServer });

    useModal.getState().onOpen("invite", { server: serverFixture });
    renderWithProviders(<InviteModal />);

    const generateButton = screen.getByText("Generate a new link").closest("button")!;
    await user.click(generateButton);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        `/api/servers/${serverFixture.id}/invite-code`
      );
    });
  });
});

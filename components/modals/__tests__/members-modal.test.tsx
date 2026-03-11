import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemberRole } from "@prisma/client";
import { useModal } from "@/hooks/use-modal-store";
import { renderWithProviders } from "@/test-utils/render";
import { serverFixture, profileFixture, memberFixture } from "@/test-utils/fixtures";
import { MembersModal } from "../members-modal";

vi.mock("axios");

const mockRouter = { push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({}),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

const guestProfile = {
  ...profileFixture,
  id: "guest-profile-id",
  userId: "guest_user_123",
  name: "Guest User",
  email: "guest@example.com",
};

const moderatorProfile = {
  ...profileFixture,
  id: "mod-profile-id",
  userId: "mod_user_123",
  name: "Mod User",
  email: "mod@example.com",
};

const serverWithMembers = {
  ...serverFixture,
  members: [
    { ...memberFixture, role: MemberRole.ADMIN, profile: profileFixture },
    {
      id: "guest-member-id",
      role: MemberRole.GUEST,
      profileId: guestProfile.id,
      serverId: serverFixture.id,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      profile: guestProfile,
    },
    {
      id: "mod-member-id",
      role: MemberRole.MODERATOR,
      profileId: moderatorProfile.id,
      serverId: serverFixture.id,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      profile: moderatorProfile,
    },
  ],
};

describe("MembersModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("does not render when modal is closed", () => {
    renderWithProviders(<MembersModal />);
    expect(screen.queryByText("Manage Members")).not.toBeInTheDocument();
  });

  it("displays member list with names and emails", () => {
    useModal.getState().onOpen("members", { server: serverWithMembers as any });
    renderWithProviders(<MembersModal />);

    expect(screen.getByText("Manage Members")).toBeInTheDocument();
    expect(screen.getByText("3 members")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Guest User")).toBeInTheDocument();
    expect(screen.getByText("Mod User")).toBeInTheDocument();
  });

  it("calls DELETE when kick is triggered", async () => {
    const user = userEvent.setup();
    const updatedServer = { ...serverWithMembers, members: [serverWithMembers.members[0]] };
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: updatedServer });

    useModal.getState().onOpen("members", { server: serverWithMembers as any });
    renderWithProviders(<MembersModal />);

    const moreButtons = document.querySelectorAll('[data-slot="dropdown-menu-trigger"]');
    expect(moreButtons.length).toBeGreaterThan(0);

    await user.click(moreButtons[0] as HTMLElement);

    await waitFor(() => {
      const kickItem = screen.getByText("Kick");
      fireEvent.click(kickItem);
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/api/members/")
      );
    });
  });

  it("calls PATCH when role is changed via dropdown", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.patch).mockResolvedValueOnce({ data: serverWithMembers });

    useModal.getState().onOpen("members", { server: serverWithMembers as any });
    renderWithProviders(<MembersModal />);

    const triggers = document.querySelectorAll('[data-slot="dropdown-menu-trigger"]');
    expect(triggers.length).toBeGreaterThan(0);
    await user.click(triggers[0] as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText("Role")).toBeInTheDocument();
    });

    const roleItem = screen.getByText("Role").closest('[role="menuitem"]') || screen.getByText("Role");
    await user.click(roleItem);

    await waitFor(() => {
      const guestItems = screen.getAllByText("Guest");
      const menuGuest = guestItems.find(el => el.closest('[role="menuitem"]'));
      if (menuGuest) {
        fireEvent.click(menuGuest);
      }
    });

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/members/"),
        expect.objectContaining({ role: "GUEST" })
      );
    });
  });
});

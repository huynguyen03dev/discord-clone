import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams } from "next/navigation";
import NavigationItem from "../navigation-item";

vi.mock("@/components/action-tooltip", () => ({
  ActionTooltip: ({ children }: any) => children,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: vi.fn().mockReturnValue({}),
  usePathname: vi.fn().mockReturnValue(""),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("NavigationItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({});
  });

  it("renders server image with correct src", () => {
    render(
      <NavigationItem
        id="server-1"
        imageUrl="https://example.com/img.png"
        name="Test Server"
      />
    );
    const img = screen.getByAltText("Channel");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/img.png");
  });

  it("highlights when current route matches server id", () => {
    vi.mocked(useParams).mockReturnValue({ serverId: "server-1" });
    render(
      <NavigationItem
        id="server-1"
        imageUrl="https://example.com/img.png"
        name="Test Server"
      />
    );
    const button = screen.getByRole("button");
    const indicator = button.firstElementChild;
    expect(indicator?.className).toContain("h-[36px]");
  });

  it("does not highlight when route does not match", () => {
    vi.mocked(useParams).mockReturnValue({ serverId: "other-server" });
    render(
      <NavigationItem
        id="server-1"
        imageUrl="https://example.com/img.png"
        name="Test Server"
      />
    );
    const button = screen.getByRole("button");
    const indicator = button.firstElementChild;
    expect(indicator?.className).toContain("h-[8px]");
    expect(indicator?.className).not.toContain("h-[36px]");
  });

  it("navigates to server on click", async () => {
    const user = userEvent.setup();
    render(
      <NavigationItem
        id="server-1"
        imageUrl="https://example.com/img.png"
        name="Test Server"
      />
    );
    await user.click(screen.getByRole("button"));
    expect(mockPush).toHaveBeenCalledWith("/servers/server-1");
  });
});

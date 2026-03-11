import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavigationAction } from "../navigation-action";

vi.mock("@/components/action-tooltip", () => ({
  ActionTooltip: ({ children }: any) => children,
}));

const mockOnOpen = vi.fn();
vi.mock("@/hooks/use-modal-store", () => ({
  useModal: () => ({
    onOpen: mockOnOpen,
    onClose: vi.fn(),
    type: null,
    data: {},
    isOpen: false,
  }),
}));

vi.mock("lucide-react", () => ({
  Plus: (props: any) => <span data-testid="plus-icon" {...props} />,
}));

describe("NavigationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onOpen with createServer when clicked", async () => {
    const user = userEvent.setup();
    render(<NavigationAction />);
    await user.click(screen.getByRole("button"));
    expect(mockOnOpen).toHaveBeenCalledWith("createServer");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServerSearch } from "../server-search";

vi.mock("lucide-react", () => ({
  Search: (props: any) => <span data-testid="search-icon" {...props} />,
}));

vi.mock("@/components/ui/command", () => ({
  CommandDialog: ({ open, children }: any) =>
    open ? <div data-testid="command-dialog">{children}</div> : null,
  CommandInput: (props: any) => <input data-testid="command-input" {...props} />,
  CommandList: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
  CommandGroup: ({ heading, children }: any) => (
    <div data-testid={`group-${heading}`}>{children}</div>
  ),
  CommandItem: ({ children, onSelect }: any) => (
    <div onClick={onSelect}>{children}</div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: vi.fn().mockReturnValue({}),
  usePathname: vi.fn().mockReturnValue(""),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("ServerSearch", () => {
  const searchData = [
    {
      label: "Text Channels",
      type: "channel" as const,
      data: [{ icon: <span>icon</span>, name: "general", id: "ch-1" }],
    },
  ];

  it("opens search dialog on Ctrl+K", () => {
    render(<ServerSearch data={searchData} />);
    expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByTestId("command-dialog")).toBeInTheDocument();
  });
});

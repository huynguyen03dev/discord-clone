import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { useModal } from "@/hooks/use-modal-store";
import { renderWithProviders } from "@/test-utils/render";
import { CreateServerModal } from "../create-server-modal";

vi.mock("axios");
vi.mock("@/components/file-upload", () => ({
  default: ({ onChange, value }: { onChange: (url: string) => void; value: string }) => (
    <div data-testid="file-upload">
      <input
        data-testid="file-upload-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" data-testid="file-upload-set" onClick={() => onChange("https://example.com/image.png")}>
        Upload
      </button>
    </div>
  ),
}));

const mockRouter = { push: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useParams: () => ({}),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("CreateServerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModal.setState({ type: null, isOpen: false, data: {} });
  });

  it("does not render when modal is closed", () => {
    renderWithProviders(<CreateServerModal />);
    expect(screen.queryByText("Customize to the server")).not.toBeInTheDocument();
  });

  it("renders when modal is open", () => {
    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);
    expect(screen.getByText("Customize to the server")).toBeInTheDocument();
  });

  it("submits form with name and imageUrl via POST /api/servers", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    await user.click(screen.getByTestId("file-upload-set"));
    await user.type(screen.getByPlaceholderText("Enter server name"), "My Server");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/servers", {
        name: "My Server",
        imageUrl: "https://example.com/image.png",
      });
    });
  });

  it("closes modal and refreshes router on successful submit", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    await user.click(screen.getByTestId("file-upload-set"));
    await user.type(screen.getByPlaceholderText("Enter server name"), "My Server");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(useModal.getState().isOpen).toBe(false);
    });
  });
});

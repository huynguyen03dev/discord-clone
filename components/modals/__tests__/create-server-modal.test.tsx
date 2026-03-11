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

  it("disables submit button and input while form is submitting", async () => {
    const user = userEvent.setup();
    let resolvePost!: (value: unknown) => void;
    vi.mocked(axios.post).mockImplementationOnce(
      () => new Promise((resolve) => { resolvePost = resolve; })
    );

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    await user.click(screen.getByTestId("file-upload-set"));
    await user.type(screen.getByPlaceholderText("Enter server name"), "My Server");

    const submitButton = screen.getByRole("button", { name: "Create" });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    });
    expect(screen.getByPlaceholderText("Enter server name")).toBeDisabled();

    resolvePost({ data: {} });

    await waitFor(() => {
      expect(useModal.getState().isOpen).toBe(false);
    });
  });

  it("shows validation error and prevents submission when name is empty", async () => {
    const user = userEvent.setup();

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    await user.click(screen.getByTestId("file-upload-set"));
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.getByText("Server name is required")).toBeInTheDocument();
    });

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("prevents submission when imageUrl is empty", async () => {
    const user = userEvent.setup();

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    await user.type(screen.getByPlaceholderText("Enter server name"), "My Server");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it("keeps modal open when API call fails", async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("Network Error"));

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    await user.click(screen.getByTestId("file-upload-set"));
    await user.type(screen.getByPlaceholderText("Enter server name"), "My Server");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    expect(screen.getByText("Customize to the server")).toBeInTheDocument();
    expect(mockRouter.refresh).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("hides modal content after successful submission", async () => {
    const user = userEvent.setup();
    vi.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    useModal.getState().onOpen("createServer");
    renderWithProviders(<CreateServerModal />);

    expect(screen.getByText("Customize to the server")).toBeInTheDocument();

    await user.click(screen.getByTestId("file-upload-set"));
    await user.type(screen.getByPlaceholderText("Enter server name"), "My Server");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(screen.queryByText("Customize to the server")).not.toBeInTheDocument();
    });
  });
});

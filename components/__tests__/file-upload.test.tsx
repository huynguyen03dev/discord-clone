import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/uploadthing", () => ({
  UploadDropzone: ({ onClientUploadComplete }: { onClientUploadComplete: (res: { url: string }[]) => void }) => (
    <button
      type="button"
      data-testid="upload-dropzone"
      onClick={() => onClientUploadComplete([{ url: "https://test.com/file.png" }])}
    >
      Upload
    </button>
  ),
}));

import FileUpload from "@/components/file-upload";

describe("FileUpload", () => {
  it("calls onChange with uploaded file URL", async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <FileUpload
        endpoint="messageFile"
        onChange={mockOnChange}
        value=""
      />
    );

    const uploadButton = screen.getByTestId("upload-dropzone");
    await user.click(uploadButton);

    expect(mockOnChange).toHaveBeenCalledWith("https://test.com/file.png");
  });
});

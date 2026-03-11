import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/render";
import { ChatWelcome } from "../chat-welcome";

describe("ChatWelcome", () => {
  it("displays welcome with #channelName for TEXT channels", () => {
    renderWithProviders(<ChatWelcome name="general" type="channel" />);

    expect(screen.getByText(/Welcome to/)).toBeInTheDocument();
    expect(
      screen.getByText(/This is the start of the #general channel/)
    ).toBeInTheDocument();
  });

  it("displays welcome with member name for conversations", () => {
    renderWithProviders(<ChatWelcome name="John Doe" type="conversation" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText(
        /This is the beginning of your direct message history with John Doe/
      )
    ).toBeInTheDocument();
  });
});

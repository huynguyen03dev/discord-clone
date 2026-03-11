import { describe, it, expect, beforeAll } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils/render";
import { ActionTooltip } from "@/components/action-tooltip";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("renderWithProviders", () => {
  it("provides TooltipProvider context for tooltip components", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ActionTooltip label="Wrapper Test">
        <button type="button">Hover me</button>
      </ActionTooltip>
    );

    const button = screen.getByRole("button", { name: "Hover me" });
    await user.hover(button);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("wrapper test");
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ActionTooltip } from "@/components/action-tooltip";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("ActionTooltip", () => {
  it("shows tooltip text on hover", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ActionTooltip label="Test Tooltip">
          <button type="button">Test</button>
        </ActionTooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole("button", { name: "Test" });

    await user.hover(button);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("test tooltip");
  });

  it("closes tooltip on Escape", async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ActionTooltip label="Test Tooltip">
          <button type="button">Test</button>
        </ActionTooltip>
      </TooltipProvider>
    );

    const button = screen.getByRole("button", { name: "Test" });
    await user.hover(button);
    await screen.findByRole("tooltip");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useChatScroll } from "../useChatScroll";

function createDiv(overrides: Record<string, number> = {}): HTMLDivElement {
  const div = document.createElement("div");
  div.scrollIntoView = vi.fn();
  Object.defineProperty(div, "scrollHeight", {
    value: overrides.scrollHeight ?? 1000,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(div, "scrollTop", {
    value: overrides.scrollTop ?? 0,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(div, "clientHeight", {
    value: overrides.clientHeight ?? 500,
    writable: true,
    configurable: true,
  });
  return div;
}

describe("useChatScroll", () => {
  let loadMore: () => void;

  beforeEach(() => {
    loadMore = vi.fn();
  });

  it("triggers loadMore when scrollTop is 0 and shouldLoadMore is true", () => {
    const chatDiv = createDiv({ scrollTop: 500 });
    const bottomDiv = createDiv();
    const chatRef = { current: chatDiv };
    const bottomRef = { current: bottomDiv };

    renderHook(() =>
      useChatScroll({
        chatRef,
        bottomRef,
        shouldLoadMore: true,
        loadMore,
        count: 10,
      })
    );

    Object.defineProperty(chatDiv, "scrollTop", { value: 0, configurable: true });
    chatDiv.dispatchEvent(new Event("scroll"));

    expect(loadMore).toHaveBeenCalled();
  });

  it("does not call loadMore when shouldLoadMore is false", () => {
    const chatDiv = createDiv({ scrollTop: 500 });
    const bottomDiv = createDiv();
    const chatRef = { current: chatDiv };
    const bottomRef = { current: bottomDiv };

    renderHook(() =>
      useChatScroll({
        chatRef,
        bottomRef,
        shouldLoadMore: false,
        loadMore,
        count: 10,
      })
    );

    Object.defineProperty(chatDiv, "scrollTop", { value: 0, configurable: true });
    chatDiv.dispatchEvent(new Event("scroll"));

    expect(loadMore).not.toHaveBeenCalled();
  });

  it("auto-scrolls bottomRef into view when near bottom and new message arrives", () => {
    const chatDiv = createDiv({
      scrollHeight: 1000,
      scrollTop: 450,
      clientHeight: 500,
    });
    const bottomDiv = createDiv();
    const chatRef = { current: chatDiv };
    const bottomRef = { current: bottomDiv };

    const { rerender } = renderHook(
      ({ count }: { count: number }) =>
        useChatScroll({
          chatRef,
          bottomRef,
          shouldLoadMore: false,
          loadMore,
          count,
        }),
      { initialProps: { count: 1 } }
    );

    rerender({ count: 2 });

    expect(bottomDiv.scrollIntoView).toHaveBeenCalled();
  });

  it("does NOT auto-scroll when user is more than 100px from bottom", () => {
    const chatDiv = createDiv({
      scrollHeight: 1000,
      scrollTop: 200,
      clientHeight: 500,
    });
    const bottomDiv = createDiv();
    const chatRef = { current: chatDiv };
    const bottomRef = { current: bottomDiv };

    const { rerender } = renderHook(
      ({ count }: { count: number }) =>
        useChatScroll({
          chatRef,
          bottomRef,
          shouldLoadMore: false,
          loadMore,
          count,
        }),
      { initialProps: { count: 1 } }
    );

    (bottomDiv.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();

    rerender({ count: 2 });

    expect(bottomDiv.scrollIntoView).not.toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" })
    );
  });
});

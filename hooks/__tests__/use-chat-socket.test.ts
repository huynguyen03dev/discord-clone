import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
};

let socketRef: typeof mockSocket | undefined = mockSocket;

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: () => ({ socket: socketRef, isConnected: true }),
}));

import { useChatSocket } from "../use-chat-socket";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useChatSocket", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    socketRef = mockSocket;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("prepends new message on addKey event", () => {
    const existingMessage = { id: "msg-1", content: "old", member: { profile: {} } };
    queryClient.setQueryData(["chat:channel1"], {
      pages: [{ items: [existingMessage] }],
      pageParams: [undefined],
    });

    renderHook(
      () =>
        useChatSocket({
          addKey: "chat:channel1:messages",
          updateKey: "chat:channel1:messages:update",
          queryKey: "chat:channel1",
        }),
      { wrapper: createWrapper(queryClient) }
    );

    const addCall = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === "chat:channel1:messages"
    );
    const addHandler = addCall![1];

    const newMessage = { id: "msg-2", content: "new", member: { profile: {} } };
    addHandler(newMessage);

    const data = queryClient.getQueryData(["chat:channel1"]) as any;
    expect(data.pages[0].items[0]).toEqual(newMessage);
    expect(data.pages[0].items[1]).toEqual(existingMessage);
  });

  it("creates initial page structure when addKey fires on empty cache", () => {
    queryClient.setQueryData(["chat:channel1"], undefined);

    renderHook(
      () =>
        useChatSocket({
          addKey: "chat:channel1:messages",
          updateKey: "chat:channel1:messages:update",
          queryKey: "chat:channel1",
        }),
      { wrapper: createWrapper(queryClient) }
    );

    const addCall = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === "chat:channel1:messages"
    );
    const addHandler = addCall![1];

    const newMessage = { id: "msg-1", content: "hello", member: { profile: {} } };
    addHandler(newMessage);

    const data = queryClient.getQueryData(["chat:channel1"]) as any;
    expect(data.pages[0].items).toEqual([newMessage]);
  });

  it("updates message by ID across all pages on updateKey event", () => {
    queryClient.setQueryData(["chat:channel1"], {
      pages: [
        { items: [{ id: "msg-1", content: "page1-msg" }] },
        { items: [{ id: "msg-2", content: "original" }] },
      ],
      pageParams: [undefined, "cursor1"],
    });

    renderHook(
      () =>
        useChatSocket({
          addKey: "chat:channel1:messages",
          updateKey: "chat:channel1:messages:update",
          queryKey: "chat:channel1",
        }),
      { wrapper: createWrapper(queryClient) }
    );

    const updateCall = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === "chat:channel1:messages:update"
    );
    const updateHandler = updateCall![1];

    const updatedMessage = { id: "msg-2", content: "edited" };
    updateHandler(updatedMessage);

    const data = queryClient.getQueryData(["chat:channel1"]) as any;
    expect(data.pages[1].items[0]).toEqual(updatedMessage);
    expect(data.pages[0].items[0].content).toBe("page1-msg");
  });

  it("calls socket.off on unmount", () => {
    const { unmount } = renderHook(
      () =>
        useChatSocket({
          addKey: "chat:channel1:messages",
          updateKey: "chat:channel1:messages:update",
          queryKey: "chat:channel1",
        }),
      { wrapper: createWrapper(queryClient) }
    );

    unmount();

    const offCalls = mockSocket.off.mock.calls.map((call: any[]) => call[0]);
    expect(offCalls).toContain("chat:channel1:messages:update");
    expect(offCalls).toContain("chat:channel1:messages");
  });

  it("returns early when socket is undefined", () => {
    socketRef = undefined;

    renderHook(
      () =>
        useChatSocket({
          addKey: "chat:channel1:messages",
          updateKey: "chat:channel1:messages:update",
          queryKey: "chat:channel1",
        }),
      { wrapper: createWrapper(queryClient) }
    );

    expect(mockSocket.on).not.toHaveBeenCalled();
  });
});

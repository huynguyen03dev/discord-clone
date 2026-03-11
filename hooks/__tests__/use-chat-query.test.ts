import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

let isConnectedRef = true;

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: () => ({ socket: null, isConnected: isConnectedRef }),
}));

const mockUseInfiniteQuery = vi.fn().mockReturnValue({
  data: undefined,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  status: "pending",
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...(actual as any),
    useInfiniteQuery: (...args: any[]) => mockUseInfiniteQuery(...args),
  };
});

import { useChatQuery } from "../use-chat-query";

describe("useChatQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConnectedRef = true;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: null }), {
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("fetches messages from API with correct URL", async () => {
    renderHook(() =>
      useChatQuery({
        queryKey: "chat:channel1",
        apiUrl: "/api/messages",
        paramKey: "channelId",
        paramValue: "ch-123",
      })
    );

    const options = mockUseInfiniteQuery.mock.calls[0][0];
    await options.queryFn({ pageParam: undefined });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("/api/messages");
    expect(calledUrl).toContain("channelId=ch-123");
  });

  it("handles cursor pagination with nextCursor", async () => {
    renderHook(() =>
      useChatQuery({
        queryKey: "chat:channel2",
        apiUrl: "/api/messages",
        paramKey: "channelId",
        paramValue: "ch-456",
      })
    );

    const options = mockUseInfiniteQuery.mock.calls[0][0];
    await options.queryFn({ pageParam: "cursor-abc" });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(calledUrl).toContain("cursor=cursor-abc");
  });

  it("disables polling when connected", () => {
    isConnectedRef = true;

    renderHook(() =>
      useChatQuery({
        queryKey: "chat:channel3",
        apiUrl: "/api/messages",
        paramKey: "channelId",
        paramValue: "ch-789",
      })
    );

    const options = mockUseInfiniteQuery.mock.calls[0][0];
    expect(options.refetchInterval).toBe(false);
  });

  it("enables polling when disconnected", () => {
    isConnectedRef = false;

    renderHook(() =>
      useChatQuery({
        queryKey: "chat:channel4",
        apiUrl: "/api/messages",
        paramKey: "channelId",
        paramValue: "ch-poll",
      })
    );

    const options = mockUseInfiniteQuery.mock.calls[0][0];
    expect(typeof options.refetchInterval).toBe("function");
    expect(options.refetchInterval()).toBe(2000);
  });
});

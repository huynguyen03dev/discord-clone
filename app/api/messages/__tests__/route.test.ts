import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { messageFixture, memberFixture, profileFixture, channelFixture } from "@/test-utils/fixtures";
import { GET } from "../route";

function makeRequest(url: string) {
  return new Request(url);
}

function makeMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...messageFixture,
    id: `msg-${i}`,
    content: `Message ${i}`,
    member: { ...memberFixture, profile: profileFixture },
  }));
}

describe("GET /api/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = makeRequest(`http://localhost/api/messages?channelId=${channelFixture.id}`);
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when channelId is missing", async () => {
    mockCurrentProfile();

    const req = makeRequest("http://localhost/api/messages");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("returns up to 13 messages ordered by createdAt DESC with nextCursor", async () => {
    mockCurrentProfile();
    const messages = makeMessages(13);
    mockDb.message.findMany.mockResolvedValue(messages as any);

    const req = makeRequest(`http://localhost/api/messages?channelId=${channelFixture.id}`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(13);
    expect(data.nextCursor).toBe("msg-12");
    expect(mockDb.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 13,
        where: { channelId: channelFixture.id },
        include: {
          member: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("returns null nextCursor when fewer than 13 messages", async () => {
    mockCurrentProfile();
    const messages = makeMessages(5);
    mockDb.message.findMany.mockResolvedValue(messages as any);

    const req = makeRequest(`http://localhost/api/messages?channelId=${channelFixture.id}`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(5);
    expect(data.nextCursor).toBeNull();
  });

  it("handles cursor pagination by skipping cursor message", async () => {
    mockCurrentProfile();
    const messages = makeMessages(13);
    mockDb.message.findMany.mockResolvedValue(messages as any);

    const cursorId = "cursor-msg-id";
    const req = makeRequest(`http://localhost/api/messages?channelId=${channelFixture.id}&cursor=${cursorId}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockDb.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 13,
        skip: 1,
        cursor: { id: cursorId },
        where: { channelId: channelFixture.id },
      }),
    );
  });

  it("does not skip or set cursor when no cursor param", async () => {
    mockCurrentProfile();
    mockDb.message.findMany.mockResolvedValue([] as any);

    const req = makeRequest(`http://localhost/api/messages?channelId=${channelFixture.id}`);
    await GET(req);

    const call = mockDb.message.findMany.mock.calls[0][0] as any;
    expect(call.skip).toBeUndefined();
    expect(call.cursor).toBeUndefined();
  });
});

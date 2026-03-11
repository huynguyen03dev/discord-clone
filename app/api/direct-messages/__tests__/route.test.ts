import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { directMessageFixture, memberFixture, profileFixture, conversationFixture } from "@/test-utils/fixtures";
import { GET } from "../route";

function makeRequest(url: string) {
  return new Request(url);
}

function makeDirectMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...directMessageFixture,
    id: `dm-${i}`,
    content: `DM ${i}`,
    member: { ...memberFixture, profile: profileFixture },
  }));
}

describe("GET /api/direct-messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = makeRequest(`http://localhost/api/direct-messages?conversationId=${conversationFixture.id}`);
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 when conversationId is missing", async () => {
    mockCurrentProfile();

    const req = makeRequest("http://localhost/api/direct-messages");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("returns up to 13 direct messages with nextCursor", async () => {
    mockCurrentProfile();
    const messages = makeDirectMessages(13);
    mockDb.directMessage.findMany.mockResolvedValue(messages as any);

    const req = makeRequest(`http://localhost/api/direct-messages?conversationId=${conversationFixture.id}`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(13);
    expect(data.nextCursor).toBe("dm-12");
    expect(mockDb.directMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 13,
        where: { conversationId: conversationFixture.id },
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
    const messages = makeDirectMessages(5);
    mockDb.directMessage.findMany.mockResolvedValue(messages as any);

    const req = makeRequest(`http://localhost/api/direct-messages?conversationId=${conversationFixture.id}`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(5);
    expect(data.nextCursor).toBeNull();
  });

  it("handles cursor pagination by skipping cursor message", async () => {
    mockCurrentProfile();
    const messages = makeDirectMessages(13);
    mockDb.directMessage.findMany.mockResolvedValue(messages as any);

    const cursorId = "cursor-dm-id";
    const req = makeRequest(`http://localhost/api/direct-messages?conversationId=${conversationFixture.id}&cursor=${cursorId}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockDb.directMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 13,
        skip: 1,
        cursor: { id: cursorId },
        where: { conversationId: conversationFixture.id },
      }),
    );
  });

  it("does not skip or set cursor when no cursor param", async () => {
    mockCurrentProfile();
    mockDb.directMessage.findMany.mockResolvedValue([] as any);

    const req = makeRequest(`http://localhost/api/direct-messages?conversationId=${conversationFixture.id}`);
    await GET(req);

    const call = mockDb.directMessage.findMany.mock.calls[0][0] as any;
    expect(call.skip).toBeUndefined();
    expect(call.cursor).toBeUndefined();
  });
});

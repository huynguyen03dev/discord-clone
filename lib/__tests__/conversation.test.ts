import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "@/test-utils/mocks/db";
import { conversationFixture } from "@/test-utils/fixtures";
import { getOrCreateConversation } from "@/lib/conversation";

const memberOneId = "member-one-id";
const memberTwoId = "member-two-id";

describe("getOrCreateConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing conversation found in first direction", async () => {
    mockDb.conversation.findFirst
      .mockResolvedValueOnce(conversationFixture as any)
      .mockResolvedValueOnce(null);

    const result = await getOrCreateConversation(memberOneId, memberTwoId);

    expect(result).toEqual(conversationFixture);
    expect(mockDb.conversation.create).not.toHaveBeenCalled();
  });

  it("returns existing conversation found in second direction", async () => {
    mockDb.conversation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(conversationFixture as any);

    const result = await getOrCreateConversation(memberOneId, memberTwoId);

    expect(result).toEqual(conversationFixture);
    expect(mockDb.conversation.create).not.toHaveBeenCalled();
  });

  it("creates new conversation when none exists", async () => {
    mockDb.conversation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockDb.conversation.create.mockResolvedValue(conversationFixture as any);

    const result = await getOrCreateConversation(memberOneId, memberTwoId);

    expect(result).toEqual(conversationFixture);
    expect(mockDb.conversation.create).toHaveBeenCalledWith({
      data: {
        memberOneId,
        memberTwoId,
      },
      include: {
        memberOne: { include: { profile: true } },
        memberTwo: { include: { profile: true } },
      },
    });
  });

  it("returns null on database error", async () => {
    mockDb.conversation.findFirst.mockRejectedValue(new Error("DB error"));
    mockDb.conversation.create.mockRejectedValue(new Error("DB error"));

    const result = await getOrCreateConversation(memberOneId, memberTwoId);

    expect(result).toBeNull();
  });
});

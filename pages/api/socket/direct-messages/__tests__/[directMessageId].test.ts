import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient, MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import {
  profileFixture,
  memberFixture,
  conversationFixture,
  directMessageFixture,
} from "@/test-utils/fixtures";

vi.mock("@/lib/current-profile-pages", () => ({
  currentProfilePages: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDeep<PrismaClient>(),
}));

import handler from "../[directMessageId]";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

const mockCurrentProfilePages = vi.mocked(currentProfilePages);
const mockDb = db as unknown as DeepMockProxy<PrismaClient>;

const memberTwoId = "550e8400-e29b-41d4-a716-446655440006";
const memberTwo = {
  ...memberFixture,
  id: memberTwoId,
  profileId: "other-profile-id",
  role: MemberRole.GUEST,
  profile: { ...profileFixture, id: "other-profile-id" },
};

const conversationWithMembers = {
  ...conversationFixture,
  memberOne: { ...memberFixture, profile: profileFixture },
  memberTwo,
};

const dmWithMember = {
  ...directMessageFixture,
  deleted: false,
  member: { ...memberFixture, profile: profileFixture },
};

const otherDmWithMember = {
  ...directMessageFixture,
  member: memberTwo,
};

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "PATCH",
    body: { content: "Updated DM" },
    query: {
      directMessageId: directMessageFixture.id,
      conversationId: conversationFixture.id,
    },
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const emit = vi.fn();
  return {
    status,
    json,
    socket: {
      server: {
        io: { emit },
      },
    },
    _emit: emit,
  } as unknown as NextApiResponseServerIo & { _emit: ReturnType<typeof vi.fn> };
}

function setupAuth() {
  mockCurrentProfilePages.mockResolvedValue(profileFixture);
  mockDb.conversation.findFirst.mockResolvedValue(conversationWithMembers as any);
}

describe("PATCH/DELETE /api/socket/direct-messages/[directMessageId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-PATCH/DELETE methods", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 400 when conversationId is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ query: { directMessageId: directMessageFixture.id } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockCurrentProfilePages.mockResolvedValue(null);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 404 when conversation is not found", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.conversation.findFirst.mockResolvedValue(null);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when direct message is not found", async () => {
    setupAuth();
    mockDb.directMessage.findFirst.mockResolvedValue(null);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when direct message is already deleted", async () => {
    setupAuth();
    mockDb.directMessage.findFirst.mockResolvedValue({
      ...dmWithMember,
      deleted: true,
    } as any);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 401 when non-owner/admin/mod tries to modify", async () => {
    const nonMemberConversation = {
      ...conversationFixture,
      memberOne: {
        ...memberFixture,
        id: "non-member-1",
        profileId: profileFixture.id,
        role: MemberRole.GUEST,
        profile: profileFixture,
      },
      memberTwo,
    };
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.conversation.findFirst.mockResolvedValue(nonMemberConversation as any);
    mockDb.directMessage.findFirst.mockResolvedValue(otherDmWithMember as any);
    const req = createMockReq({ method: "DELETE" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  describe("PATCH", () => {
    it("allows owner to edit direct message content", async () => {
      setupAuth();
      mockDb.directMessage.findFirst.mockResolvedValue(dmWithMember as any);
      const updatedDM = { ...dmWithMember, content: "Updated DM" };
      mockDb.directMessage.update.mockResolvedValue(updatedDM as any);
      const req = createMockReq({ method: "PATCH", body: { content: "Updated DM" } });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.directMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { content: "Updated DM" },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._emit).toHaveBeenCalledWith(
        `chat:${conversationFixture.id}:messages:update`,
        updatedDM
      );
    });

    it("returns 401 when non-owner tries to edit", async () => {
      setupAuth();
      mockDb.directMessage.findFirst.mockResolvedValue(otherDmWithMember as any);
      const req = createMockReq({ method: "PATCH" });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("DELETE", () => {
    it("soft-deletes direct message for owner", async () => {
      setupAuth();
      mockDb.directMessage.findFirst.mockResolvedValue(dmWithMember as any);
      const deletedDM = {
        ...dmWithMember,
        content: "This message has been deleted.",
        fileUrl: null,
        deleted: true,
      };
      mockDb.directMessage.update.mockResolvedValue(deletedDM as any);
      const req = createMockReq({ method: "DELETE" });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.directMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            fileUrl: null,
            content: "This message has been deleted.",
            deleted: true,
          },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._emit).toHaveBeenCalledWith(
        `chat:${conversationFixture.id}:messages:update`,
        deletedDM
      );
    });

    it("allows admin to delete other member direct message", async () => {
      const adminConversation = {
        ...conversationFixture,
        memberOne: { ...memberFixture, role: MemberRole.ADMIN, profile: profileFixture },
        memberTwo,
      };
      mockCurrentProfilePages.mockResolvedValue(profileFixture);
      mockDb.conversation.findFirst.mockResolvedValue(adminConversation as any);
      mockDb.directMessage.findFirst.mockResolvedValue(otherDmWithMember as any);
      mockDb.directMessage.update.mockResolvedValue({
        ...otherDmWithMember,
        content: "This message has been deleted.",
        fileUrl: null,
        deleted: true,
      } as any);
      const req = createMockReq({ method: "DELETE" });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.directMessage.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("allows moderator to delete other member direct message", async () => {
      const modConversation = {
        ...conversationFixture,
        memberOne: { ...memberFixture, role: MemberRole.MODERATOR, profile: profileFixture },
        memberTwo,
      };
      mockCurrentProfilePages.mockResolvedValue(profileFixture);
      mockDb.conversation.findFirst.mockResolvedValue(modConversation as any);
      mockDb.directMessage.findFirst.mockResolvedValue(otherDmWithMember as any);
      mockDb.directMessage.update.mockResolvedValue({
        ...otherDmWithMember,
        content: "This message has been deleted.",
        fileUrl: null,
        deleted: true,
      } as any);
      const req = createMockReq({ method: "DELETE" });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.directMessage.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

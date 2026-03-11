import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient, MemberRole } from "@prisma/client";
import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import {
  profileFixture,
  serverFixture,
  channelFixture,
  memberFixture,
  messageFixture,
} from "@/test-utils/fixtures";

vi.mock("@/lib/current-profile-pages", () => ({
  currentProfilePages: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDeep<PrismaClient>(),
}));

import handler from "../[messageId]";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

const mockCurrentProfilePages = vi.mocked(currentProfilePages);
const mockDb = db as unknown as DeepMockProxy<PrismaClient>;

const messageWithMember = {
  ...messageFixture,
  deleted: false,
  member: { ...memberFixture, profile: profileFixture },
};

const otherProfileId = "550e8400-e29b-41d4-a716-446655440099";
const otherMember = {
  ...memberFixture,
  id: "other-member-id",
  profileId: otherProfileId,
  role: MemberRole.GUEST,
};
const otherMessage = {
  ...messageFixture,
  member: { ...otherMember, profile: { ...profileFixture, id: otherProfileId } },
};

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "PATCH",
    body: { content: "Updated content" },
    query: {
      messageId: messageFixture.id,
      channelId: channelFixture.id,
      serverId: serverFixture.id,
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

function setupAuthAndLookups(member = memberFixture) {
  mockCurrentProfilePages.mockResolvedValue(profileFixture);
  mockDb.server.findFirst.mockResolvedValue(serverFixture);
  mockDb.channel.findFirst.mockResolvedValue(channelFixture);
  mockDb.member.findFirst.mockResolvedValue(member);
}

describe("PATCH/DELETE /api/socket/messages/[messageId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-PATCH/DELETE methods", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ query: { channelId: channelFixture.id, messageId: messageFixture.id } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when channelId is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ query: { serverId: serverFixture.id, messageId: messageFixture.id } });
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

  it("returns 404 when server is not found", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(null);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when channel is not found", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(null);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when member is not found", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(null);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when message is not found", async () => {
    setupAuthAndLookups();
    mockDb.message.findFirst.mockResolvedValue(null);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when message is already deleted", async () => {
    setupAuthAndLookups();
    mockDb.message.findFirst.mockResolvedValue({
      ...messageWithMember,
      deleted: true,
    } as any);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 401 when non-owner/admin/mod tries to modify", async () => {
    const guestMember = { ...memberFixture, id: "guest-id", profileId: "guest-profile-id", role: MemberRole.GUEST };
    setupAuthAndLookups(guestMember);
    mockDb.message.findFirst.mockResolvedValue(otherMessage as any);
    const req = createMockReq({ method: "DELETE" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  describe("PATCH", () => {
    it("allows owner to edit message content", async () => {
      setupAuthAndLookups();
      mockDb.message.findFirst.mockResolvedValue(messageWithMember as any);
      const updatedMessage = { ...messageWithMember, content: "Updated content" };
      mockDb.message.update.mockResolvedValue(updatedMessage as any);
      const req = createMockReq({ method: "PATCH", body: { content: "Updated content" } });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { content: "Updated content" },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res._emit).toHaveBeenCalledWith(
        `chat:${channelFixture.id}:messages:update`,
        updatedMessage
      );
    });

    it("returns 401 when non-owner tries to edit", async () => {
      setupAuthAndLookups();
      mockDb.message.findFirst.mockResolvedValue(otherMessage as any);
      const req = createMockReq({ method: "PATCH" });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("DELETE", () => {
    it("soft-deletes message for owner", async () => {
      setupAuthAndLookups();
      mockDb.message.findFirst.mockResolvedValue(messageWithMember as any);
      const deletedMessage = {
        ...messageWithMember,
        content: "This message has been deleted.",
        fileUrl: null,
        deleted: true,
      };
      mockDb.message.update.mockResolvedValue(deletedMessage as any);
      const req = createMockReq({ method: "DELETE" });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.message.update).toHaveBeenCalledWith(
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
        `chat:${channelFixture.id}:messages:update`,
        deletedMessage
      );
    });

    it("allows admin to delete other member message", async () => {
      const adminMember = { ...memberFixture, role: MemberRole.ADMIN };
      setupAuthAndLookups(adminMember);
      mockDb.message.findFirst.mockResolvedValue(otherMessage as any);
      const deletedMessage = {
        ...otherMessage,
        content: "This message has been deleted.",
        fileUrl: null,
        deleted: true,
      };
      mockDb.message.update.mockResolvedValue(deletedMessage as any);
      const req = createMockReq({ method: "DELETE" });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.message.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("allows moderator to delete other member message", async () => {
      const modMember = { ...memberFixture, role: MemberRole.MODERATOR };
      setupAuthAndLookups(modMember);
      mockDb.message.findFirst.mockResolvedValue(otherMessage as any);
      mockDb.message.update.mockResolvedValue({
        ...otherMessage,
        content: "This message has been deleted.",
        fileUrl: null,
        deleted: true,
      } as any);
      const req = createMockReq({ method: "DELETE" });
      const res = createMockRes();

      await handler(req, res);

      expect(mockDb.message.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});

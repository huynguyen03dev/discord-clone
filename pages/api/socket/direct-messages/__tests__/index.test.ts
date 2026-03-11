import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
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

import handler from "../index";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

const mockCurrentProfilePages = vi.mocked(currentProfilePages);
const mockDb = db as unknown as DeepMockProxy<PrismaClient>;

const memberTwoId = "550e8400-e29b-41d4-a716-446655440006";
const memberTwo = {
  ...memberFixture,
  id: memberTwoId,
  profileId: "other-profile-id",
  profile: { ...profileFixture, id: "other-profile-id" },
};

const conversationWithMembers = {
  ...conversationFixture,
  memberOne: { ...memberFixture, profile: profileFixture },
  memberTwo,
};

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "POST",
    body: { content: "Hey there!" },
    query: { conversationId: conversationFixture.id },
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

describe("POST /api/socket/direct-messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-POST methods", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 400 when conversationId is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ query: {} });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when content is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ body: {} });
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

  it("creates direct message and emits socket event on success", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.conversation.findFirst.mockResolvedValue(conversationWithMembers as any);
    const createdDM = {
      ...directMessageFixture,
      member: { ...memberFixture, profile: profileFixture },
    };
    mockDb.directMessage.create.mockResolvedValue(createdDM as any);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.directMessage.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res._emit).toHaveBeenCalledWith(
      `chat:${conversationFixture.id}:messages`,
      createdDM
    );
  });

  it("validates sender is memberOne or memberTwo of conversation", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.conversation.findFirst.mockResolvedValue(conversationWithMembers as any);
    const createdDM = {
      ...directMessageFixture,
      member: { ...memberFixture, profile: profileFixture },
    };
    mockDb.directMessage.create.mockResolvedValue(createdDM as any);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.conversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { memberOne: { profileId: profileFixture.id } },
            { memberTwo: { profileId: profileFixture.id } },
          ]),
        }),
      })
    );
  });

  it("detects IMAGE fileKind for image/* mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.conversation.findFirst.mockResolvedValue(conversationWithMembers as any);
    mockDb.directMessage.create.mockResolvedValue({
      ...directMessageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: { content: "pic", fileMimeType: "image/jpeg" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.directMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "IMAGE" }),
      })
    );
  });

  it("defaults to UNKNOWN fileKind for unrecognized mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.conversation.findFirst.mockResolvedValue(conversationWithMembers as any);
    mockDb.directMessage.create.mockResolvedValue({
      ...directMessageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: { content: "file", fileMimeType: "application/zip" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.directMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "UNKNOWN" }),
      })
    );
  });
});

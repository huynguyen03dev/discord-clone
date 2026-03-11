import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";
import { PrismaClient } from "@prisma/client";
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

import handler from "../index";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

const mockCurrentProfilePages = vi.mocked(currentProfilePages);
const mockDb = db as unknown as DeepMockProxy<PrismaClient>;

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: "POST",
    body: { content: "Hello, world!" },
    query: { serverId: serverFixture.id, channelId: channelFixture.id },
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

describe("POST /api/socket/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 405 for non-POST methods", async () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockCurrentProfilePages.mockResolvedValue(null);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ query: { channelId: channelFixture.id } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when channelId is missing", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    const req = createMockReq({ query: { serverId: serverFixture.id } });
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

  it("creates message and emits socket event on success", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    const createdMessage = {
      ...messageFixture,
      member: { ...memberFixture, profile: profileFixture },
    };
    mockDb.message.create.mockResolvedValue(createdMessage as any);
    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.message.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res._emit).toHaveBeenCalledWith(
      `chat:${channelFixture.id}:messages`,
      createdMessage
    );
  });

  it("detects IMAGE fileKind for image/* mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    mockDb.message.create.mockResolvedValue({
      ...messageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: {
        content: "pic",
        fileUrl: "https://example.com/image.png",
        fileMimeType: "image/png",
      },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "IMAGE" }),
      })
    );
  });

  it("detects VIDEO fileKind for video/* mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    mockDb.message.create.mockResolvedValue({
      ...messageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: { content: "vid", fileMimeType: "video/mp4" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "VIDEO" }),
      })
    );
  });

  it("detects AUDIO fileKind for audio/* mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    mockDb.message.create.mockResolvedValue({
      ...messageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: { content: "audio", fileMimeType: "audio/mpeg" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "AUDIO" }),
      })
    );
  });

  it("detects PDF fileKind for application/pdf mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    mockDb.message.create.mockResolvedValue({
      ...messageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: { content: "doc", fileMimeType: "application/pdf" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "PDF" }),
      })
    );
  });

  it("defaults to UNKNOWN fileKind for unrecognized mimeType", async () => {
    mockCurrentProfilePages.mockResolvedValue(profileFixture);
    mockDb.server.findFirst.mockResolvedValue(serverFixture);
    mockDb.channel.findFirst.mockResolvedValue(channelFixture);
    mockDb.member.findFirst.mockResolvedValue(memberFixture);
    mockDb.message.create.mockResolvedValue({
      ...messageFixture,
      member: { ...memberFixture, profile: profileFixture },
    } as any);
    const req = createMockReq({
      body: { content: "file", fileMimeType: "application/octet-stream" },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileKind: "UNKNOWN" }),
      })
    );
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture, serverFixture, channelFixture } from "@/test-utils/fixtures";
import { POST } from "../route";

vi.mock("uuid", () => ({
  v4: () => "mocked-uuid-v4",
}));

function createJsonRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/servers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/servers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = createJsonRequest({ name: "My Server", imageUrl: "https://example.com/img.png" });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it("creates server with UUID invite code, general TEXT channel, and ADMIN member", async () => {
    const profile = mockCurrentProfile();
    const createdServer = {
      ...serverFixture,
      inviteCode: "mocked-uuid-v4",
      channels: [channelFixture],
    };
    mockDb.server.create.mockResolvedValue(createdServer as any);

    const req = createJsonRequest({ name: "My Server", imageUrl: "https://example.com/server.png" });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(JSON.parse(JSON.stringify(createdServer)));

    expect(mockDb.server.create).toHaveBeenCalledWith({
      data: {
        profileId: profile.id,
        name: "My Server",
        imageUrl: "https://example.com/server.png",
        inviteCode: "mocked-uuid-v4",
        channels: {
          create: {
            name: "general",
            profileId: profile.id,
          },
        },
        members: {
          create: {
            profileId: profile.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        channels: true,
      },
    });
  });
});

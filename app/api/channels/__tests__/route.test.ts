import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../../../test-utils/mocks/db";
import "../../../../test-utils/mocks/auth";
import { mockCurrentProfile } from "../../../../test-utils/mocks/auth";
import { mockDb } from "../../../../test-utils/mocks/db";
import { profileFixture, serverFixture } from "../../../../test-utils/fixtures";
import { ChannelType } from "@prisma/client";
import { POST } from "../route";

function makeRequest(body: object, serverId?: string) {
  const url = serverId
    ? `http://localhost/api/channels?serverId=${serverId}`
    : "http://localhost/api/channels";
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/channels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates channel with valid data and returns 200", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockResolvedValueOnce(serverFixture);

    const req = makeRequest(
      { name: "test-channel", type: ChannelType.TEXT },
      serverFixture.id
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(JSON.parse(JSON.stringify(serverFixture)));
    expect(mockDb.server.update).toHaveBeenCalledWith({
      where: {
        id: serverFixture.id,
        members: {
          some: {
            profileId: profileFixture.id,
            role: { in: ["ADMIN", "MODERATOR"] },
          },
        },
      },
      data: {
        channels: {
          create: {
            profileId: profileFixture.id,
            name: "test-channel",
            type: ChannelType.TEXT,
          },
        },
      },
    });
  });

  it("returns 400 when name is 'general'", async () => {
    mockCurrentProfile();

    const req = makeRequest(
      { name: "general", type: ChannelType.TEXT },
      serverFixture.id
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Name cannot be 'general'");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValueOnce(null);

    const req = makeRequest(
      { name: "test-channel", type: ChannelType.TEXT },
      serverFixture.id
    );
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const req = makeRequest({ name: "test-channel", type: ChannelType.TEXT });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Server ID is required");
  });

  it("returns null when Prisma where clause filters out non-admin member", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockResolvedValueOnce(null);

    const req = makeRequest(
      { name: "test-channel", type: ChannelType.TEXT },
      serverFixture.id
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toBeNull();
  });
});

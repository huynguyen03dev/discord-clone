import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture, serverFixture } from "@/test-utils/fixtures";
import { PATCH } from "../route";

function makeParams(serverId: string): { params: Promise<{ serverId: string }> } {
  return { params: Promise.resolve({ serverId }) };
}

describe("PATCH /api/servers/[serverId]/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = new Request("http://localhost/api/servers/server-id/leave", { method: "PATCH" });
    const response = await PATCH(req, makeParams("server-id"));

    expect(response.status).toBe(401);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const req = new Request("http://localhost/api/servers//leave", { method: "PATCH" });
    const response = await PATCH(req, makeParams(""));

    expect(response.status).toBe(400);
  });

  it("removes member from server (non-owner)", async () => {
    const profile = mockCurrentProfile();
    const updatedServer = { ...serverFixture };
    mockDb.server.update.mockResolvedValue(updatedServer);

    const req = new Request("http://localhost/api/servers/server-id/leave", { method: "PATCH" });
    const response = await PATCH(req, makeParams(serverFixture.id));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(JSON.parse(JSON.stringify(updatedServer)));

    expect(mockDb.server.update).toHaveBeenCalledWith({
      where: {
        id: serverFixture.id,
        profileId: {
          not: profile.id,
        },
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      data: {
        members: {
          deleteMany: {
            profileId: profile.id,
          },
        },
      },
    });
  });

  it("prevents server owner from leaving (Prisma rejects via where clause)", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockRejectedValue(new Error("Record not found"));

    const req = new Request("http://localhost/api/servers/server-id/leave", { method: "PATCH" });
    const response = await PATCH(req, makeParams(serverFixture.id));

    expect(response.status).toBe(500);
  });
});

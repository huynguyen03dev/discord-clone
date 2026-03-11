import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { serverFixture } from "@/test-utils/fixtures";
import { PATCH } from "../route";

vi.mock("uuid", () => ({
  v4: () => "mocked-uuid-v4",
}));

function makeParams(serverId: string): { params: Promise<{ serverId: string }> } {
  return { params: Promise.resolve({ serverId }) };
}

describe("PATCH /api/servers/[serverId]/invite-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = new Request("http://localhost/api/servers/server-id/invite-code", { method: "PATCH" });
    const response = await PATCH(req, makeParams("server-id"));

    expect(response.status).toBe(401);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const req = new Request("http://localhost/api/servers//invite-code", { method: "PATCH" });
    const response = await PATCH(req, makeParams(""));

    expect(response.status).toBe(400);
  });

  it("regenerates UUID invite code for owned server", async () => {
    const profile = mockCurrentProfile();
    const updatedServer = { ...serverFixture, inviteCode: "mocked-uuid-v4" };
    mockDb.server.update.mockResolvedValue(updatedServer);

    const req = new Request("http://localhost/api/servers/server-id/invite-code", { method: "PATCH" });
    const response = await PATCH(req, makeParams(serverFixture.id));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.inviteCode).toBe("mocked-uuid-v4");

    expect(mockDb.server.update).toHaveBeenCalledWith({
      where: {
        id: serverFixture.id,
        profileId: profile.id,
      },
      data: {
        inviteCode: "mocked-uuid-v4",
      },
    });
  });
});

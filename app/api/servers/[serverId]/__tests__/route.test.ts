import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { serverFixture } from "@/test-utils/fixtures";
import { PATCH, DELETE } from "../route";

function createJsonRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/servers/server-id", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeParams(serverId: string): { params: Promise<{ serverId: string }> } {
  return { params: Promise.resolve({ serverId }) };
}

describe("PATCH /api/servers/[serverId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = createJsonRequest({ name: "Updated", imageUrl: "https://example.com/new.png" });
    const response = await PATCH(req, makeParams("server-id"));

    expect(response.status).toBe(401);
  });

  it("updates server name and imageUrl", async () => {
    const profile = mockCurrentProfile();
    const updatedServer = { ...serverFixture, name: "Updated", imageUrl: "https://example.com/new.png" };
    mockDb.server.update.mockResolvedValue(updatedServer);

    const req = createJsonRequest({ name: "Updated", imageUrl: "https://example.com/new.png" });
    const response = await PATCH(req, makeParams(serverFixture.id));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(JSON.parse(JSON.stringify(updatedServer)));

    expect(mockDb.server.update).toHaveBeenCalledWith({
      where: {
        id: serverFixture.id,
        profileId: profile.id,
      },
      data: {
        name: "Updated",
        imageUrl: "https://example.com/new.png",
      },
    });
  });
});

describe("DELETE /api/servers/[serverId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = new Request("http://localhost/api/servers/server-id", { method: "DELETE" });
    const response = await DELETE(req, makeParams("server-id"));

    expect(response.status).toBe(401);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const req = new Request("http://localhost/api/servers/", { method: "DELETE" });
    const response = await DELETE(req, makeParams(""));

    expect(response.status).toBe(400);
  });

  it("deletes server and returns 200", async () => {
    const profile = mockCurrentProfile();
    mockDb.server.delete.mockResolvedValue(serverFixture);

    const req = new Request("http://localhost/api/servers/server-id", { method: "DELETE" });
    const response = await DELETE(req, makeParams(serverFixture.id));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(JSON.parse(JSON.stringify(serverFixture)));

    expect(mockDb.server.delete).toHaveBeenCalledWith({
      where: {
        id: serverFixture.id,
        profileId: profile.id,
      },
    });
  });
});

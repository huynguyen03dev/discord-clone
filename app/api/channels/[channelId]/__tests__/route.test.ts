import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../../../../test-utils/mocks/db";
import "../../../../../test-utils/mocks/auth";
import { mockCurrentProfile } from "../../../../../test-utils/mocks/auth";
import { mockDb } from "../../../../../test-utils/mocks/db";
import {
  profileFixture,
  serverFixture,
  channelFixture,
} from "../../../../../test-utils/fixtures";
import { ChannelType } from "@prisma/client";
import { DELETE, PATCH } from "../route";

const channelId = channelFixture.id;

function makeDeleteRequest(serverId?: string) {
  const url = serverId
    ? `http://localhost/api/channels/${channelId}?serverId=${serverId}`
    : `http://localhost/api/channels/${channelId}`;
  return new Request(url, { method: "DELETE" });
}

function makePatchRequest(body: object, serverId?: string) {
  const url = serverId
    ? `http://localhost/api/channels/${channelId}?serverId=${serverId}`
    : `http://localhost/api/channels/${channelId}`;
  return new Request(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const routeParams = { params: { channelId } };

describe("DELETE /api/channels/[channelId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes channel and returns 200", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockResolvedValueOnce(serverFixture);

    const res = await DELETE(makeDeleteRequest(serverFixture.id), routeParams);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(JSON.parse(JSON.stringify(serverFixture)));
    expect(mockDb.server.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: serverFixture.id }),
        data: {
          channels: {
            delete: {
              id: channelId,
              name: { not: "general" },
            },
          },
        },
      })
    );
  });

  it("blocks deletion of 'general' channel via Prisma constraint", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockRejectedValueOnce(
      new Error("Record to delete does not exist")
    );

    const res = await DELETE(makeDeleteRequest(serverFixture.id), routeParams);

    expect(res.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(
      (await import("@/lib/current-profile")).currentProfile
    ).mockResolvedValueOnce(null);

    const res = await DELETE(makeDeleteRequest(serverFixture.id), routeParams);

    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const res = await DELETE(makeDeleteRequest(), routeParams);

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Server ID missing");
  });

  it("returns 400 when channelId is missing", async () => {
    mockCurrentProfile();

    const res = await DELETE(makeDeleteRequest(serverFixture.id), {
      params: { channelId: "" },
    });

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Channel ID missing");
  });

  it("blocks GUEST role via Prisma where clause", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockRejectedValueOnce(new Error("Record not found"));

    const res = await DELETE(makeDeleteRequest(serverFixture.id), routeParams);

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/channels/[channelId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates channel and returns 200", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockResolvedValueOnce(serverFixture);

    const res = await PATCH(
      makePatchRequest(
        { name: "updated-channel", type: ChannelType.AUDIO },
        serverFixture.id
      ),
      routeParams
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(JSON.parse(JSON.stringify(serverFixture)));
    expect(mockDb.server.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          channels: {
            update: {
              where: {
                id: channelId,
                NOT: { name: "general" },
              },
              data: {
                name: "updated-channel",
                type: ChannelType.AUDIO,
              },
            },
          },
        },
      })
    );
  });

  it("blocks rename to 'general' via Prisma constraint", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockRejectedValueOnce(
      new Error("Record to update not found")
    );

    const res = await PATCH(
      makePatchRequest(
        { name: "general", type: ChannelType.TEXT },
        serverFixture.id
      ),
      routeParams
    );

    expect(res.status).toBe(500);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(
      (await import("@/lib/current-profile")).currentProfile
    ).mockResolvedValueOnce(null);

    const res = await PATCH(
      makePatchRequest(
        { name: "test", type: ChannelType.TEXT },
        serverFixture.id
      ),
      routeParams
    );

    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const res = await PATCH(
      makePatchRequest({ name: "test", type: ChannelType.TEXT }),
      routeParams
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Server ID missing");
  });

  it("returns 400 when channelId is missing", async () => {
    mockCurrentProfile();

    const res = await PATCH(
      makePatchRequest(
        { name: "test", type: ChannelType.TEXT },
        serverFixture.id
      ),
      { params: { channelId: "" } }
    );

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Channel ID missing");
  });

  it("blocks GUEST role via Prisma where clause", async () => {
    mockCurrentProfile();
    mockDb.server.update.mockRejectedValueOnce(new Error("Record not found"));

    const res = await PATCH(
      makePatchRequest(
        { name: "test-channel", type: ChannelType.TEXT },
        serverFixture.id
      ),
      routeParams
    );

    expect(res.status).toBe(500);
  });
});

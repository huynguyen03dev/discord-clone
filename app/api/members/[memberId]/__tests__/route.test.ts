import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockCurrentProfile } from "@/test-utils/mocks/auth";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture, serverFixture, memberFixture } from "@/test-utils/fixtures";
import { PATCH, DELETE } from "../route";
import { MemberRole } from "@prisma/client";

function makeRequest(url: string, options: RequestInit = {}) {
  return new Request(url, options);
}

function makeParams(memberId: string) {
  return { params: Promise.resolve({ memberId }) };
}

const serverWithMembers = {
  ...serverFixture,
  members: [
    { ...memberFixture, profile: profileFixture },
  ],
};

describe("PATCH /api/members/[memberId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/members/member-1?serverId=server-1", {
      method: "PATCH",
      body: JSON.stringify({ role: MemberRole.MODERATOR }),
    });

    const res = await PATCH(req, makeParams("member-1"));

    expect(res.status).toBe(401);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const req = makeRequest("http://localhost/api/members/member-1", {
      method: "PATCH",
      body: JSON.stringify({ role: MemberRole.MODERATOR }),
    });

    const res = await PATCH(req, makeParams("member-1"));

    expect(res.status).toBe(400);
  });

  it("updates member role and returns server with members and profiles", async () => {
    const profile = mockCurrentProfile();
    mockDb.server.update.mockResolvedValue(serverWithMembers as any);

    const req = makeRequest(`http://localhost/api/members/${memberFixture.id}?serverId=${serverFixture.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: MemberRole.MODERATOR }),
    });

    const res = await PATCH(req, makeParams(memberFixture.id));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(JSON.parse(JSON.stringify(serverWithMembers)));
    expect(mockDb.server.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: serverFixture.id, profileId: profile.id },
        data: {
          members: {
            update: {
              where: {
                id: memberFixture.id,
                profileId: { not: profile.id },
              },
              data: { role: MemberRole.MODERATOR },
            },
          },
        },
        include: {
          members: {
            include: { profile: true },
            orderBy: { role: "asc" },
          },
        },
      }),
    );
  });

  it("prevents self-modification by excluding own profileId", async () => {
    const profile = mockCurrentProfile();
    mockDb.server.update.mockResolvedValue(serverWithMembers as any);

    const req = makeRequest(`http://localhost/api/members/${memberFixture.id}?serverId=${serverFixture.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role: MemberRole.GUEST }),
    });

    await PATCH(req, makeParams(memberFixture.id));

    expect(mockDb.server.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          members: {
            update: {
              where: {
                id: memberFixture.id,
                profileId: { not: profile.id },
              },
              data: { role: MemberRole.GUEST },
            },
          },
        },
      }),
    );
  });
});

describe("DELETE /api/members/[memberId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked((await import("@/lib/current-profile")).currentProfile).mockResolvedValue(null);

    const req = makeRequest("http://localhost/api/members/member-1?serverId=server-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, makeParams("member-1"));

    expect(res.status).toBe(401);
  });

  it("returns 400 when serverId is missing", async () => {
    mockCurrentProfile();

    const req = makeRequest("http://localhost/api/members/member-1", {
      method: "DELETE",
    });

    const res = await DELETE(req, makeParams("member-1"));

    expect(res.status).toBe(400);
  });

  it("kicks member and returns server with members and profiles", async () => {
    const profile = mockCurrentProfile();
    mockDb.server.update.mockResolvedValue(serverWithMembers as any);

    const req = makeRequest(`http://localhost/api/members/${memberFixture.id}?serverId=${serverFixture.id}`, {
      method: "DELETE",
    });

    const res = await DELETE(req, makeParams(memberFixture.id));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(JSON.parse(JSON.stringify(serverWithMembers)));
    expect(mockDb.server.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: serverFixture.id, profileId: profile.id },
        data: {
          members: {
            deleteMany: {
              id: memberFixture.id,
              profileId: { not: profile.id },
            },
          },
        },
        include: {
          members: {
            include: { profile: true },
            orderBy: { role: "asc" },
          },
        },
      }),
    );
  });

  it("prevents self-kick by excluding own profileId", async () => {
    const profile = mockCurrentProfile();
    mockDb.server.update.mockResolvedValue(serverWithMembers as any);

    const req = makeRequest(`http://localhost/api/members/${memberFixture.id}?serverId=${serverFixture.id}`, {
      method: "DELETE",
    });

    await DELETE(req, makeParams(memberFixture.id));

    expect(mockDb.server.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          members: {
            deleteMany: {
              id: memberFixture.id,
              profileId: { not: profile.id },
            },
          },
        },
      }),
    );
  });
});

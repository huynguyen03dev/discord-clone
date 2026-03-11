import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture } from "@/test-utils/fixtures";

vi.mock("@clerk/nextjs/server", () => ({
  getAuth: vi.fn(),
}));

import { getAuth } from "@clerk/nextjs/server";
import { currentProfilePages } from "@/lib/current-profile-pages";

const mockGetAuth = vi.mocked(getAuth);

describe("currentProfilePages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile for authenticated request", async () => {
    const req = {} as any;
    mockGetAuth.mockResolvedValue({ userId: profileFixture.userId } as any);
    mockDb.profile.findUnique.mockResolvedValue(profileFixture);

    const result = await currentProfilePages(req);

    expect(result).toEqual(profileFixture);
    expect(mockGetAuth).toHaveBeenCalledWith(req);
    expect(mockDb.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: profileFixture.userId },
    });
  });

  it("returns null for unauthenticated request", async () => {
    const req = {} as any;
    mockGetAuth.mockResolvedValue({ userId: null } as any);

    const result = await currentProfilePages(req);

    expect(result).toBeNull();
    expect(mockDb.profile.findUnique).not.toHaveBeenCalled();
  });
});

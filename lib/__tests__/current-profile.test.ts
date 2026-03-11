import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture } from "@/test-utils/fixtures";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { currentProfile } from "@/lib/current-profile";

const mockAuth = vi.mocked(auth);

describe("currentProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns profile for authenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: profileFixture.userId } as any);
    mockDb.profile.findUnique.mockResolvedValue(profileFixture);

    const result = await currentProfile();

    expect(result).toEqual(profileFixture);
    expect(mockDb.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: profileFixture.userId },
    });
  });

  it("returns null for unauthenticated user", async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const result = await currentProfile();

    expect(result).toBeNull();
    expect(mockDb.profile.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when profile not found in database", async () => {
    mockAuth.mockResolvedValue({ userId: "user_unknown" } as any);
    mockDb.profile.findUnique.mockResolvedValue(null);

    const result = await currentProfile();

    expect(result).toBeNull();
  });
});

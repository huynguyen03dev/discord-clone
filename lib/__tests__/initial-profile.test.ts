import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture } from "@/test-utils/fixtures";

const mockRedirectToSignIn = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
  auth: vi.fn(),
}));

import { currentUser, auth } from "@clerk/nextjs/server";
import { initialProfile } from "@/lib/initial-profile";

const mockCurrentUser = vi.mocked(currentUser);
const mockAuth = vi.mocked(auth);

const clerkUser = {
  id: profileFixture.userId,
  firstName: "Test",
  lastName: "User",
  imageUrl: profileFixture.imageUrl,
  emailAddresses: [{ emailAddress: profileFixture.email }],
};

describe("initialProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing profile without creating new one", async () => {
    mockCurrentUser.mockResolvedValue(clerkUser as any);
    mockDb.profile.findUnique.mockResolvedValue(profileFixture);

    const result = await initialProfile();

    expect(result).toEqual(profileFixture);
    expect(mockDb.profile.findUnique).toHaveBeenCalledWith({
      where: { userId: clerkUser.id },
    });
    expect(mockDb.profile.create).not.toHaveBeenCalled();
  });

  it("creates new profile with Clerk user data", async () => {
    mockCurrentUser.mockResolvedValue(clerkUser as any);
    mockDb.profile.findUnique.mockResolvedValue(null);
    mockDb.profile.create.mockResolvedValue(profileFixture);

    const result = await initialProfile();

    expect(result).toEqual(profileFixture);
    expect(mockDb.profile.create).toHaveBeenCalledWith({
      data: {
        userId: clerkUser.id,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
        imageUrl: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0].emailAddress,
      },
    });
  });

  it("calls redirectToSignIn when unauthenticated", async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ redirectToSignIn: mockRedirectToSignIn } as any);

    await initialProfile();

    expect(mockRedirectToSignIn).toHaveBeenCalled();
    expect(mockDb.profile.findUnique).not.toHaveBeenCalled();
  });
});

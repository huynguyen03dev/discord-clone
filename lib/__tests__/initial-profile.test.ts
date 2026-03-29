import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "@/test-utils/mocks/db";
import { profileFixture } from "@/test-utils/fixtures";

const redirectResponse = { redirect: true };
const mockRedirectToSignIn = vi.fn(() => redirectResponse);

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

  it("creates profile using userId as name when firstName and lastName are null", async () => {
    const userWithoutName = { ...clerkUser, firstName: null, lastName: null };
    mockCurrentUser.mockResolvedValue(userWithoutName as any);
    mockDb.profile.findUnique.mockResolvedValue(null);
    mockDb.profile.create.mockResolvedValue(profileFixture);

    await initialProfile();

    expect(mockDb.profile.create).toHaveBeenCalledWith({
      data: {
        userId: clerkUser.id,
        name: clerkUser.id,
        imageUrl: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0].emailAddress,
      },
    });
  });

  it("creates profile with trimmed name when only one name field is present", async () => {
    const userWithOnlyFirstName = { ...clerkUser, firstName: "John", lastName: null };
    mockCurrentUser.mockResolvedValue(userWithOnlyFirstName as any);
    mockDb.profile.findUnique.mockResolvedValue(null);
    mockDb.profile.create.mockResolvedValue(profileFixture);

    await initialProfile();

    expect(mockDb.profile.create).toHaveBeenCalledWith({
      data: {
        userId: clerkUser.id,
        name: "John",
        imageUrl: clerkUser.imageUrl,
        email: clerkUser.emailAddresses[0].emailAddress,
      },
    });
  });

  it("creates profile with empty email when emailAddresses is empty", async () => {
    const userWithoutEmail = { ...clerkUser, emailAddresses: [] };
    mockCurrentUser.mockResolvedValue(userWithoutEmail as any);
    mockDb.profile.findUnique.mockResolvedValue(null);
    mockDb.profile.create.mockResolvedValue(profileFixture);

    await initialProfile();

    expect(mockDb.profile.create).toHaveBeenCalledWith({
      data: {
        userId: clerkUser.id,
        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
        imageUrl: clerkUser.imageUrl,
        email: "",
      },
    });
  });

  it("calls redirectToSignIn when unauthenticated", async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ redirectToSignIn: mockRedirectToSignIn } as any);

    const result = await initialProfile();

    expect(mockRedirectToSignIn).toHaveBeenCalled();
    expect(result).toBe(redirectResponse);
    expect(mockDb.profile.findUnique).not.toHaveBeenCalled();
    expect(mockDb.profile.create).not.toHaveBeenCalled();
  });
});

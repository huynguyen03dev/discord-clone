import { vi } from "vitest";
import { currentProfile } from "@/lib/current-profile";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { profileFixture } from "../fixtures";

vi.mock("@/lib/current-profile", () => ({
  currentProfile: vi.fn(),
}));

vi.mock("@/lib/current-profile-pages", () => ({
  currentProfilePages: vi.fn(),
}));

export function mockCurrentProfile(profile = profileFixture) {
  vi.mocked(currentProfile).mockResolvedValue(profile);
  return profile;
}

export function mockCurrentProfilePages(profile = profileFixture) {
  vi.mocked(currentProfilePages).mockResolvedValue(profile);
  return profile;
}

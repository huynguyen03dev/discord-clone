import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberRole } from "@prisma/client";
import { ServerMember } from "../server-member";
import { memberFixture, profileFixture } from "@/test-utils/fixtures";

vi.mock("@/components/user-avatar", () => ({
  UserAvatar: ({ src }: any) => <img data-testid="user-avatar" src={src} />,
}));

vi.mock("lucide-react", () => ({
  ShieldAlert: (props: any) => <span data-testid="shield-alert-icon" {...props} />,
  ShieldCheck: (props: any) => (
    <span data-testid="shield-check-icon" {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: vi.fn().mockReturnValue({}),
  usePathname: vi.fn().mockReturnValue(""),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

describe("ServerMember", () => {
  const baseMember = { ...memberFixture, profile: profileFixture };

  it("renders member name and avatar", () => {
    render(<ServerMember member={baseMember} />);
    expect(screen.getByText(profileFixture.name)).toBeInTheDocument();
    expect(screen.getByTestId("user-avatar")).toHaveAttribute(
      "src",
      profileFixture.imageUrl
    );
  });

  it("shows ShieldCheck icon for MODERATOR role", () => {
    const member = { ...baseMember, role: MemberRole.MODERATOR };
    render(<ServerMember member={member} />);
    expect(screen.getByTestId("shield-check-icon")).toBeInTheDocument();
  });

  it("shows ShieldAlert icon for ADMIN role", () => {
    const member = { ...baseMember, role: MemberRole.ADMIN };
    render(<ServerMember member={member} />);
    expect(screen.getByTestId("shield-alert-icon")).toBeInTheDocument();
  });

  it("shows no icon for GUEST role", () => {
    const member = { ...baseMember, role: MemberRole.GUEST };
    render(<ServerMember member={member} />);
    expect(
      screen.queryByTestId("shield-check-icon")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("shield-alert-icon")
    ).not.toBeInTheDocument();
  });
});

import type { Profile, Server, Member, Channel, Message, Conversation, DirectMessage } from "@prisma/client";
import { MemberRole, ChannelType, FileKind } from "@prisma/client";

export const profileFixture: Profile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: "user_test_123",
  name: "Test User",
  imageUrl: "https://example.com/avatar.png",
  email: "test@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const serverFixture: Server = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Test Server",
  imageUrl: "https://example.com/server.png",
  inviteCode: "abc123def456",
  profileId: profileFixture.id,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const memberFixture: Member = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  role: MemberRole.ADMIN,
  profileId: profileFixture.id,
  serverId: serverFixture.id,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const channelFixture: Channel = {
  id: "550e8400-e29b-41d4-a716-446655440003",
  name: "general",
  type: ChannelType.TEXT,
  profileId: profileFixture.id,
  serverId: serverFixture.id,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const messageFixture: Message = {
  id: "550e8400-e29b-41d4-a716-446655440004",
  content: "Hello, world!",
  fileUrl: null,
  fileName: null,
  fileMimeType: null,
  fileSize: null,
  fileKind: null,
  memberId: memberFixture.id,
  channelId: channelFixture.id,
  deleted: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const conversationFixture: Conversation = {
  id: "550e8400-e29b-41d4-a716-446655440005",
  memberOneId: memberFixture.id,
  memberTwoId: "550e8400-e29b-41d4-a716-446655440006",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const directMessageFixture: DirectMessage = {
  id: "550e8400-e29b-41d4-a716-446655440007",
  content: "Hey there!",
  fileUrl: null,
  fileName: null,
  fileMimeType: null,
  fileSize: null,
  fileKind: null,
  memberId: memberFixture.id,
  conversationId: conversationFixture.id,
  deleted: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";

import { FileKind as PrismaFileKind } from "@prisma/client";

const inferKindFromMime = (mime?: string): PrismaFileKind => {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return PrismaFileKind.IMAGE;
  if (m.startsWith("video/")) return PrismaFileKind.VIDEO;
  if (m.startsWith("audio/")) return PrismaFileKind.AUDIO;
  if (m === "application/pdf" || m.endsWith("/pdf")) return PrismaFileKind.PDF;
  return PrismaFileKind.UNKNOWN;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    console.log("[MESSAGES_POST] Profile:", profile ? "Found" : "Not found");

    const { content, fileUrl } = req.body;
    const { conversationId } = req.query;

    const { fileName, fileMimeType, fileSize } = req.body;

    const fileKind = inferKindFromMime(fileMimeType);

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!conversationId) {
      return res.status(400).json({ error: "Conversation ID is missing" });
    }

    if (!content) {
      return res.status(400).json({ error: "Content is missing" });
    }
    
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId as string,
        OR: [
          {
            memberOne: { profileId: profile.id },
          },
          {
            memberTwo: { profileId: profile.id },
          }
        ]
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          }
        },
        memberTwo: {
          include: {
            profile: true,
          }
        }
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }


    const member = conversation.memberOne.profileId === profile.id
      ? conversation.memberOne
      : conversation.memberTwo;
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const message = await db.directMessage.create({
      data: {
        content,
        fileUrl,
        fileName,
        fileMimeType,
        fileSize,
        fileKind,
        conversationId: conversation.id,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const conversationKey = `chat:${conversationId}:messages`;

    res?.socket?.server?.io?.emit(conversationKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.log("[DIRECT_MESSAGE_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}

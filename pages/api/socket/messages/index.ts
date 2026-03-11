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
    const { content, fileUrl } = req.body;
    const { serverId, channelId } = req.query;
    const { fileName, fileMimeType, fileSize } = req.body;

    if (!serverId) {
      return res.status(400).json({ error: "Server ID is missing" });
    }

    if (!channelId) {
      return res.status(400).json({ error: "Channel ID is missing" });
    }

    if (!content) {
      return res.status(400).json({ error: "Content is missing" });
    }

    const fileKind = inferKindFromMime(fileMimeType);

    const profile = await currentProfilePages(req);
    console.log("[MESSAGES_POST] Profile:", profile ? "Found" : "Not found");

    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [server, channel, member] = await Promise.all([
      db.server.findFirst({
        where: {
          id: serverId as string,
          members: {
            some: {
              profileId: profile.id,
            },
          },
        },
      }),
      db.channel.findFirst({
        where: {
          id: channelId as string,
          serverId: serverId as string,
        },
      }),
      db.member.findFirst({
        where: {
          serverId: serverId as string,
          profileId: profile.id,
        },
      }),
    ]);

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        fileName,
        fileMimeType,
        fileSize,
        fileKind,
        channelId: channelId as string,
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

    const channelKey = `chat:${channelId}:messages`;

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.log("[MESSAGES_POST]", error);
    return res.status(500).json({ error: "Internal Error" });
  }
}

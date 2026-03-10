import { Channel, Member, Profile, Server } from "@prisma/client";
import { Server as NetServer } from "http";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIo = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export type ServerWithMembersWithProfiles = Server & {
  members: (Member & { profile: Profile })[];
}

export type ServerWithChannelsMembersProfiles = Server & {
  channels: Channel[];
  members: (Member & { profile: Profile })[];
}
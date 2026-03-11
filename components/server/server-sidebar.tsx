import { ServerHeader } from "@/components/server/server-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerSearch } from "./server-search";
import { ChannelType, MemberRole } from "@prisma/client";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { Separator } from "../ui/separator";
import { ServerSection } from "./server-section";

import { ServerChannel } from "./server-channel";
import { ServerMember } from "./server-member";
import { ServerWithChannelsMembersProfiles } from "@/types";

interface ServerSidebarProps {
  server: ServerWithChannelsMembersProfiles;
  profileId: string;
}

const iconMap = {
  [ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
  [ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
  [ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
}

const roleIconMap = {
  [MemberRole.GUEST]: null,
  [MemberRole.MODERATOR]: <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />,
  [MemberRole.ADMIN]: <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />,
}



export const ServerSidebar = ({ server, profileId }: ServerSidebarProps) => {

  if (!server) {
    return null;
  }
  const textChannels = server.channels.filter((channel) => channel.type === ChannelType.TEXT);
  const audioChannels = server.channels.filter((channel) => channel.type === ChannelType.AUDIO);
  const videoChannels = server.channels.filter((channel) => channel.type === ChannelType.VIDEO);

  const members = server.members.filter((member) => member.profileId !== profileId);

  const role = server.members.find((member) => member.profileId === profileId)?.role;

  return (
    <div className="flex h-full w-full flex-col text-primary bg-[#F2F3F5] dark:bg-[#2B2D31]">
      <ServerHeader
        server={server}
        role={role}
      />
      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          <ServerSearch
            data={[
              {
                label: "Text Channels",
                type: "channel",
                data: textChannels?.map((channel) => ({
                  icon: iconMap[channel.type],
                  name: channel.name,
                  id: channel.id,
                }))
              },
              {
                label: "Audio Channels",
                type: "channel",
                data: audioChannels?.map((channel) => ({
                  icon: iconMap[channel.type],
                  name: channel.name,
                  id: channel.id,
                }))
              },
              {
                label: "Video Channels",
                type: "channel",
                data: videoChannels?.map((channel) => ({
                  icon: iconMap[channel.type],
                  name: channel.name,
                  id: channel.id,
                }))
              },
              {
                label: "Members",
                type: "member",
                data: members?.map((member) => ({
                  icon: roleIconMap[member.role],
                  name: member.profile.name,
                  id: member.id,
                }))
              }
            ]} />
        </div>
        <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700 rounded-md" />
        {!!textChannels?.length && (
          <div className="mb-2">
            <ServerSection
              label="Text Channels"
              sectionType="channels"
              channelType={ChannelType.TEXT}
              role={role}
            />
            {textChannels.map((channel) => (
              <ServerChannel 
                key={channel.id}
                channel={channel}
                role={role}
              />
            ))}
          </div>
        )}
        {!!audioChannels?.length && (
          <div className="mb-2">
            <ServerSection
              label="Audio Channels"
              sectionType="channels"
              channelType={ChannelType.AUDIO}
              role={role}
            />
            {audioChannels.map((channel) => (
              <ServerChannel 
                key={channel.id}
                channel={channel}
                role={role}
              />
            ))}
          </div>
        )}
        {!!videoChannels?.length && (
          <div className="mb-2">
            <ServerSection
              label="Video Channels"
              sectionType="channels"
              channelType={ChannelType.VIDEO}
              role={role}
            />
            {videoChannels.map((channel) => (
              <ServerChannel 
                key={channel.id}
                channel={channel}
                role={role}
              />
            ))}
          </div>
        )}
        {!!members?.length && (
          <div className="mb-2">
            <ServerSection
              label="Members"
              sectionType="members"
              role={role}
              server={server}
            />
            {members.map((member) => (
              <ServerMember 
                key={member.id}
                member={member}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>  
  )
}

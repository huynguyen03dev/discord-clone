"use client";

import { memo } from "react";
import { Channel, ChannelType, MemberRole } from "@prisma/client";
import { ServerWithMembersWithProfiles } from "@/types";
import { Edit, Hash, Lock, Mic, Trash, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "../action-tooltip";
import { ModalType, useModal } from "@/hooks/use-modal-store";

interface ServerChannelProps {
  channel: Channel;
  server: ServerWithMembersWithProfiles;
  role?: MemberRole;
}

const iconMap = {
  [ChannelType.TEXT]: Hash,
  [ChannelType.AUDIO]: Mic,
  [ChannelType.VIDEO]: Video,
}

const ServerChannelComponent = ({ channel, server, role }: ServerChannelProps) => {
  const params = useParams();
  const router = useRouter();
  const { onOpen } = useModal();

  const Icon = iconMap[channel.type];

  const onClick = () => {
    router.push(`/servers/${params?.serverId}/channels/${channel.id}`);
  }

  const onAction = (event: React.MouseEvent, modalType: ModalType) => {
    event.stopPropagation();
    onOpen(modalType, { channel });
  }


  return (
    <button
      onClick={onClick}
      className={cn(
        "group px-2 py-2 rounded-md flex items-center text-sm gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-2",
        params?.channelId === channel.id && "bg-zinc-700/20 dark:bg-zinc-700"
      )}
    >
      <Icon className="flex-shrink-0 w-5 h-5 text-zinc-500" />
      <p className={cn(
        "line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
        params?.channelId === channel.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white"
      )}>
        {channel.name}
      </p>
      {channel.name !== "general" && role !== MemberRole.GUEST && (
        <div className="ml-auto flex items-center gap-x-2">
          <ActionTooltip label="Edit">
            <Edit 
              className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition" 
              onClick={(event) => onAction(event, "editChannel")}
            />
          </ActionTooltip>
          <ActionTooltip label="Delete">
            <Trash
              className="hidden group-hover:block w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition" 
              onClick={(event) => onAction(event, "deleteChannel")}
            />
          </ActionTooltip>
        </div>
      )}
      {channel.name === "general" && (
        <Lock className="ml-auto w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      )}
    </button>
  )
}

export const ServerChannel = memo(ServerChannelComponent);

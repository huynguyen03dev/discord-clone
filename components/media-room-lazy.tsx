"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const MediaRoom = dynamic(
  () => import("@/components/media-room").then((mod) => mod.MediaRoom),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="w-7 h-7 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading...
        </p>
      </div>
    ),
  }
);

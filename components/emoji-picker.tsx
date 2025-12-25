"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import Picker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

interface EmojiPickerProps {
  onChange: (emoji: string) => void;
}

export const EmojiPicker = ({ onChange }: EmojiPickerProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="h-[24px] w-[24px] flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
          aria-label="Add emoji"
        >
          <Smile className="h-5 w-5 text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={40}
        className="bg-transparent border-none shadow-none drop-shadow-none mb-16"
      >
        <Picker
          onEmojiClick={(emojiData) => onChange(emojiData.emoji)}
          theme={resolvedTheme as Theme}
          lazyLoadEmojis={true}
        />
      </PopoverContent>
    </Popover>
  );
};

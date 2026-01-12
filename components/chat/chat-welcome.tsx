import { Hash } from "lucide-react";

interface ChatWelcomeProps {
  name: string;
  type: "channel" | "conversation";
}

export const ChatWelcome = ({ name, type }: ChatWelcomeProps) => {
  return (
    <div className="px-4 mb-4 space-y-2">
      {type === "channel" && (
        <div className="h-[75px] w-[75px] rounded-full bg-zinc-500 dark:bg-zinc-700 flex items-center justify-center">
          <Hash className="h-12 w-12 text-white" />
        </div>
      )}
      <p className="text-xl md:text-3xl font-bold">
        {type === "channel" ? "Welcome to" : ""} {name}
      </p>
      {type === "channel" ? (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          This is the start of the #{name} channel.
        </p>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          This is the beginning of your direct message history with {name}.
        </p>
      )}
    </div>
  );
};

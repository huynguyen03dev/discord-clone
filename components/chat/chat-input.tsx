"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import axios from "axios";
import qs from "query-string";

import { z } from "zod";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "../emoji-picker";
import { useRouter } from "next/navigation";

interface ChatInputProps {
  name: string;
  type: "channel" | "conversation";
  apiUrl: string;
  query: Record<string, string>;
}

const formSchema = z.object({
  content: z.string().min(1),
});


export const ChatInput = ({
  name,
  type,
  apiUrl,
  query,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      await axios.post(url, values);
      form.reset();
      router.refresh();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6">
                  <button
                    type="button"
                    onClick={() => onOpen("messageFile", {
                      apiUrl: apiUrl,
                      query,
                    })}
                    className="absolute top-7 left-8 bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-400 transition h-[24px] w-[24px] dark:hover:bg-zinc-300 rounded-full p-1 flex items-center justify-center"
                  >
                    <PlusIcon className="h-4 w-4 text-white dark:text-[#313338]" />
                  </button>
                  <Input
                    {...field}
                    disabled={isLoading}
                    placeholder={`Message ${type === "channel" ? "#" : ""}${name}`}
                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-300"
                  />
                  <div className="absolute top-7 right-8">
                    <EmojiPicker onChange={(emoji) => field.onChange(field.value + emoji)}/>
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
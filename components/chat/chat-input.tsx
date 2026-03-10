"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Member, Profile } from "@prisma/client";

type MemberWithProfile = Member & { profile: Profile };

interface ChatInputProps {
  name: string;
  type: "channel" | "conversation";
  apiUrl: string;
  query: Record<string, string>;
  chatId: string;
  member: MemberWithProfile;
}

const formSchema = z.object({
  content: z.string().min(1),
});


export const ChatInput = ({
  name,
  type,
  apiUrl,
  query,
  chatId,
  member,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const queryClient = useQueryClient();
  const queryKey = `chat:${chatId}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const { mutate: sendMessage } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });
      return axios.post(url, values);
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: [queryKey] });

      const previousData = queryClient.getQueryData([queryKey]);

      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        content: values.content,
        fileUrl: null,
        fileName: null,
        fileMimeType: null,
        fileSize: null,
        memberId: member.id,
        channelId: type === "channel" ? chatId : null,
        conversationId: type === "conversation" ? chatId : null,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        member: {
          ...member,
          profile: member.profile,
        },
      };

      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{ items: [optimisticMessage] }],
            pageParams: [undefined],
          };
        }

        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          items: [optimisticMessage, ...newPages[0].items],
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });

      form.reset();

      return { previousData };
    },
    onError: (_err, _values, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([queryKey], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    sendMessage(values);
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
                      chatId,
                      member,
                    })}
                    className="absolute top-7 left-8 bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-400 transition h-[24px] w-[24px] dark:hover:bg-zinc-300 rounded-full p-1 flex items-center justify-center"
                  >
                    <PlusIcon className="h-4 w-4 text-white dark:text-[#313338]" />
                  </button>
                  <Input
                    {...field}
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

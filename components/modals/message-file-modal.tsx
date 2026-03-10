"use client";

import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import qs from "query-string";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import FileUpload from "@/components/file-upload";
import { useModal } from "@/hooks/use-modal-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  fileUrl: z.string().min(1, {
    message: "Attachment is required",
  }),
});


export const MessageFileModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const queryClient = useQueryClient();

  const isModalOpen = isOpen && type === "messageFile";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileUrl: "",
    },
  });

  const { apiUrl, query, chatId, member } = data;
  const queryKey = chatId ? `chat:${chatId}` : "";

  const [uploadInfo, setUploadInfo] = useState<{
    fileName?: string;
    fileMimeType?: string;
    fileSize?: number;
  } | null>(null);

  const { mutate: sendFile, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const url = qs.stringifyUrl({
        url: apiUrl || "",
        query: query,
      });
      return axios.post(url, {
        ...values,
        content: values.fileUrl,
        fileName: uploadInfo?.fileName,
        fileMimeType: uploadInfo?.fileMimeType,
        fileSize: uploadInfo?.fileSize,
      });
    },
    onMutate: async (values) => {
      if (!queryKey || !member) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: [queryKey] });

      const previousData = queryClient.getQueryData([queryKey]);

      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        content: values.fileUrl,
        fileUrl: values.fileUrl,
        fileName: uploadInfo?.fileName || null,
        fileMimeType: uploadInfo?.fileMimeType || null,
        fileSize: uploadInfo?.fileSize || null,
        memberId: member.id,
        channelId: query?.channelId || null,
        conversationId: query?.conversationId || null,
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

      return { previousData };
    },
    onError: (_err, _values, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([queryKey], context.previousData);
      }
    },
    onSettled: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      handleClose();
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    sendFile(values);
  };

  const handleClose = () => {
    form.reset();
    setUploadInfo(null);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Add an attachment
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500">
            Send a file to the channel
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 px-6">
              <div className="flex items-center justify-center text-center">
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="messageFile"
                          value={field.value}
                          onChange={(url) => {
                            field.onChange(url);
                            if (!url) setUploadInfo(null);
                          }}
                          onUploadInfo={setUploadInfo}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="bg-gray-100 px-6 py-4">
              <Button disabled={isPending} variant="primary">
                Send
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
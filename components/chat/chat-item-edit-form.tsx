"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import qs from "query-string";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  content: z.string().min(1),
});

interface ChatItemEditFormProps {
  content: string;
  id: string;
  socketUrl: string;
  socketQuery: Record<string, string>;
  onCancel: () => void;
}

export const ChatItemEditForm = ({
  content,
  id,
  socketUrl,
  socketQuery,
  onCancel,
}: ChatItemEditFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      await axios.patch(url, values);
      onCancel();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    form.reset({
      content: content,
    });
  }, [form, content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-center w-full gap-x-2 pt-2"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <div className="relative w-full">
                  <Input
                    disabled={isLoading}
                    className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    placeholder="Edited message"
                    {...field}
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <Button disabled={isLoading} size="sm" variant="primary">
          Save
        </Button>
      </form>
      <span className="text-[10px] mt-1 text-zinc-400">
        Press escape to cancel, enter to save
      </span>
    </Form>
  );
};

export default ChatItemEditForm;

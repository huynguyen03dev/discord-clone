import { useEffect, useLayoutEffect, useState } from 'react';

type ChatScrollProps = {
  chatRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  shouldLoadMore: boolean;
  loadMore: () => void;
  count: number;
};

export const useChatScroll = ({
  chatRef,
  bottomRef,
  shouldLoadMore,
  loadMore,
  count
}: ChatScrollProps) => {
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load more when scrolled to top
  useEffect(() => {
    const topDiv = chatRef?.current;

    const handleScroll = () => {
      const scrollTop = topDiv?.scrollTop;

      if (scrollTop === 0 && shouldLoadMore) {
        loadMore();
      }
    };

    topDiv?.addEventListener("scroll", handleScroll);

    return () => {
      topDiv?.removeEventListener("scroll", handleScroll);
    }
  }, [shouldLoadMore, loadMore, chatRef]);

  // Initial scroll: instant, before browser paint
  useLayoutEffect(() => {
    if (!hasInitialized && count > 0 && bottomRef?.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
      setHasInitialized(true);
    }
  }, [hasInitialized, bottomRef, count]);

  // Subsequent auto-scroll: smooth, only when near bottom
  useEffect(() => {
    if (!hasInitialized) return;

    const topDiv = chatRef?.current;
    if (!topDiv) return;

    const distanceFromBottom = topDiv.scrollHeight - topDiv.scrollTop - topDiv.clientHeight;
    if (distanceFromBottom < 100) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [count, bottomRef, chatRef, hasInitialized]);
}

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrigin } from "../use-origin";

describe("useOrigin", () => {
  it("returns empty string before mount", () => {
    let initialResult: string | undefined;
    const { result } = renderHook(() => {
      const origin = useOrigin();
      if (initialResult === undefined) {
        initialResult = origin;
      }
      return origin;
    });

    expect(initialResult).toBe("");
  });

  it("returns window.location.origin after mount", () => {
    const { result } = renderHook(() => useOrigin());

    expect(result.current).toBe(window.location.origin);
  });
});

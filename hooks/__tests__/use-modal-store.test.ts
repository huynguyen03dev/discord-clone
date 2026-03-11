import { describe, it, expect, beforeEach } from "vitest";
import { useModal } from "../use-modal-store";
import { serverFixture, channelFixture } from "@/test-utils/fixtures";

describe("useModal", () => {
  beforeEach(() => {
    useModal.setState({ type: null, data: {}, isOpen: false });
  });

  it("onOpen sets type and isOpen for createServer", () => {
    useModal.getState().onOpen("createServer");
    const state = useModal.getState();
    expect(state.type).toBe("createServer");
    expect(state.isOpen).toBe(true);
  });

  it("onOpen sets type and isOpen for invite", () => {
    useModal.getState().onOpen("invite");
    const state = useModal.getState();
    expect(state.type).toBe("invite");
    expect(state.isOpen).toBe(true);
  });

  it("onOpen sets data when provided", () => {
    useModal.getState().onOpen("editChannel", {
      server: serverFixture,
      channel: channelFixture,
    });
    const state = useModal.getState();
    expect(state.type).toBe("editChannel");
    expect(state.isOpen).toBe(true);
    expect(state.data.server).toEqual(serverFixture);
    expect(state.data.channel).toEqual(channelFixture);
  });

  it("onClose resets isOpen to false and type to null", () => {
    useModal.getState().onOpen("createServer");
    expect(useModal.getState().isOpen).toBe(true);

    useModal.getState().onClose();
    const state = useModal.getState();
    expect(state.isOpen).toBe(false);
    expect(state.type).toBeNull();
  });
});

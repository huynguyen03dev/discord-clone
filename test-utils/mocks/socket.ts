import { vi } from "vitest";

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: true,
};

vi.mock("@/components/providers/socket-provider", () => ({
  useSocket: () => ({ socket: mockSocket, isConnected: true }),
}));

export { mockSocket };

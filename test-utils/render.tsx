import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isSignedIn: true,
    userId: "user_test_123",
  }),
  useUser: () => ({
    isSignedIn: true,
    user: { id: "user_test_123", fullName: "Test User" },
  }),
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => <div data-testid="user-button" />,
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/components/providers/socket-provider", () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
  useSocket: () => ({
    socket: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connected: true },
    isConnected: true,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { createTestQueryClient };

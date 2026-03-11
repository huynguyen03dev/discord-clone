import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
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

// Provider tree mirrors production (app/layout.tsx):
// - ClerkProvider: mocked at module level (vi.mock above)
// - ThemeProvider: mocked at module level (vi.mock above)
// - QueryClientProvider: real, with retry disabled for deterministic tests
// - TooltipProvider: real, required by Radix tooltip components
// Excluded:
// - ModalProvider: Zustand stores work without providers; modals test their own state
// - SocketProvider: not in root layout; mocked separately when needed
function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
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

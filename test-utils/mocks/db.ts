import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "vitest-mock-extended";
import { vi } from "vitest";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: mockDeep<PrismaClient>(),
}));

export const mockDb = db as unknown as DeepMockProxy<PrismaClient>;

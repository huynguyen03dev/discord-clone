import { describe, it, expect, vi, beforeEach } from "vitest";

describe("db singleton", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a PrismaClient instance", async () => {
    const { db } = await import("@/lib/db");
    expect(db).toBeDefined();
    expect(db.profile).toBeDefined();
  });

  it("caches instance on globalThis in development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    delete (globalThis as any).prisma;

    const { db: db1 } = await import("@/lib/db");

    expect((globalThis as any).prisma).toBe(db1);

    process.env.NODE_ENV = originalEnv;
  });

  it("returns same instance from globalThis cache", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    delete (globalThis as any).prisma;

    const { db: db1 } = await import("@/lib/db");
    const cachedInstance = (globalThis as any).prisma;

    vi.resetModules();
    const { db: db2 } = await import("@/lib/db");

    expect(db2).toBe(cachedInstance);

    process.env.NODE_ENV = originalEnv;
  });
});

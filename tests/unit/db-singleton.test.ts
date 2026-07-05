import { beforeEach, describe, expect, it, vi } from "vitest";

const envMocks = vi.hoisted(() => ({
  env: {
    DATABASE_URL: "postgres://sharply.test/db",
    NODE_ENV: "production" as "development" | "production" | "test",
  },
}));

const postgresMock = vi.hoisted(() => vi.fn(() => ({ __conn: "postgres-conn" })));
const drizzleMock = vi.hoisted(() =>
  vi.fn((conn: unknown) => ({
    conn,
    select: vi.fn(() => conn),
  })),
);

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => envMocks);
vi.mock("postgres", () => ({
  default: postgresMock,
}));
vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: drizzleMock,
}));
vi.mock("~/server/db/schema", () => ({}));

describe("db singleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    envMocks.env.NODE_ENV = "production";
  });

  it("reuses the same db client across repeated getDb calls in production", async () => {
    const { getDb } = await import("~/server/db/index");

    const first = getDb();
    const second = getDb();

    expect(first).toBe(second);
    expect(postgresMock).toHaveBeenCalledOnce();
    expect(drizzleMock).toHaveBeenCalledOnce();
  });

  it("keeps the proxy bound to the same production client", async () => {
    const { db } = await import("~/server/db/index");

    const first = db.select();
    const second = db.select();

    expect(first).toEqual({ __conn: "postgres-conn" });
    expect(second).toEqual({ __conn: "postgres-conn" });
    expect(postgresMock).toHaveBeenCalledOnce();
    expect(drizzleMock).toHaveBeenCalledOnce();
  });
});

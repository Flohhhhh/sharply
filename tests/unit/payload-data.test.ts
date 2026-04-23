import { beforeEach,describe,expect,it,vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  unstable_cache: vi.fn(
    <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) => fn,
  ),
}));

const payloadMocks = vi.hoisted(() => ({
  getPayload: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);
vi.mock("payload", () => payloadMocks);
vi.mock("server-only", () => ({}));
vi.mock("~/payload.config", () => ({
  default: {},
}));

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("payload data client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("retries payload initialization after a rejected client promise", async () => {
    const initError = new Error("payload init failed");
    const payloadClient = {
      find: vi.fn().mockResolvedValue({
        docs: [{ slug: "retry-succeeded" }],
      }),
    };

    payloadMocks.getPayload
      .mockRejectedValueOnce(initError)
      .mockResolvedValueOnce(payloadClient);

    const { getNewsPostsData } = await import("~/server/payload/data");

    await expect(getNewsPostsData()).rejects.toThrow(initError);
    await expect(getNewsPostsData()).resolves.toEqual([
      { slug: "retry-succeeded" },
    ]);

    expect(payloadMocks.getPayload).toHaveBeenCalledTimes(2);
    expect(payloadClient.find).toHaveBeenCalledTimes(1);
    expect(payloadClient.find).toHaveBeenCalledWith({
      collection: "news",
      limit: -1,
    });
  });

  it("shares a single in-flight payload client promise across concurrent callers", async () => {
    const deferredClient = createDeferred<{
      find: ReturnType<typeof vi.fn>;
    }>();
    const payloadClient = {
      find: vi.fn(({ collection }: { collection: string }) =>
        Promise.resolve({ docs: [{ collection }] }),
      ),
    };

    payloadMocks.getPayload.mockReturnValueOnce(deferredClient.promise);

    const { getNewsPostsData,getReviewsData } = await import(
      "~/server/payload/data"
    );

    const newsPromise = getNewsPostsData();
    const reviewsPromise = getReviewsData();

    expect(payloadMocks.getPayload).toHaveBeenCalledTimes(1);

    deferredClient.resolve(payloadClient);

    await expect(newsPromise).resolves.toEqual([{ collection: "news" }]);
    await expect(reviewsPromise).resolves.toEqual([{ collection: "review" }]);
    expect(payloadMocks.getPayload).toHaveBeenCalledTimes(1);
  });
});

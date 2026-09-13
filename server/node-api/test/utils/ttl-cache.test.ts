import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import TtlCache from "../../src/utils/ttl-cache";

describe("ttl-cache", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  test("Case: Returns undefined for a missing key", () => {
    const cache = new TtlCache<string>(60_000, 10);
    expect(cache.get("missing")).toBeUndefined();
  });

  test("Case: Stores and retrieves a value before expiry", () => {
    const cache = new TtlCache<number>(60_000, 10);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  test("Case: Expires entries after the TTL", () => {
    jest.useFakeTimers();
    const cache = new TtlCache<string>(1_000, 10);
    cache.set("a", "fresh");
    jest.advanceTimersByTime(1_001);
    expect(cache.get("a")).toBeUndefined();
  });

  test("Case: Evicts the oldest entry when max size is reached", () => {
    const cache = new TtlCache<string>(60_000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });
});

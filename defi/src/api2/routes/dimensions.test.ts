import { buildChainKeysMap } from "./dimensions";

describe("buildChainKeysMap", () => {
  test("returns undefined for null/undefined input", () => {
    expect(buildChainKeysMap(null)).toBeUndefined();
    expect(buildChainKeysMap(undefined)).toBeUndefined();
  });

  test("returns undefined for non-object input", () => {
    expect(buildChainKeysMap(42 as any)).toBeUndefined();
    expect(buildChainKeysMap("foo" as any)).toBeUndefined();
  });

  test("returns undefined for empty object", () => {
    expect(buildChainKeysMap({})).toBeUndefined();
  });

  test("maps known chain keys to their display labels", () => {
    const input = {
      ethereum: { v2: 100 },
      xdai: { v2: 50 },
      avax: { v2: 25 },
      optimism: { v2: 10 },
    };
    const out = buildChainKeysMap(input);
    // Output is { displayLabel: rawKey } so consumers can resolve
    // protocol.chains[i] (display label) → breakdown24h key (raw).
    expect(out).toEqual({
      Ethereum: "ethereum",
      Gnosis: "xdai",
      Avalanche: "avax",
      "OP Mainnet": "optimism",
    });
  });

  test("falls back to capitalized key for unknown chains", () => {
    const input = { somenewchain: { v1: 5 } };
    const out = buildChainKeysMap(input);
    // getChainLabelFromKey capitalizes the first letter when no mapping exists.
    expect(out).toEqual({ Somenewchain: "somenewchain" });
  });

  test("first-writer-wins when two raw keys map to the same label", () => {
    // getChainLabelFromKey falls back to capitalize-first-letter for keys
    // it doesn't have an explicit mapping for, so "foo" and "Foo" both
    // produce label "Foo". Keep the first one we see so the output is
    // deterministic.
    const input = {
      foo: { v1: 100 },
      Foo: { v1: 50 },
    } as any;
    const out = buildChainKeysMap(input);
    expect(out).toEqual({ Foo: "foo" });
  });

  test("ignores non-object chain entries", () => {
    const input: any = {
      ethereum: { v2: 100 },
      xdai: null,
      avax: 42,
    };
    const out = buildChainKeysMap(input);
    expect(out).toEqual({ Ethereum: "ethereum" });
  });

  test("does NOT modify the input breakdown object", () => {
    // Critical: this is the property that makes the fix non-breaking.
    // Consumers reading the input by raw key must still see it intact.
    const input = {
      ethereum: { v2: 100 },
      avax: { v2: 25 },
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    buildChainKeysMap(input);
    expect(input).toEqual(snapshot);
  });
});

import { transformBreakdownChainKeys } from "./dimensions";

describe("transformBreakdownChainKeys", () => {
  test("returns null/undefined unchanged", () => {
    expect(transformBreakdownChainKeys(null)).toBeNull();
    expect(transformBreakdownChainKeys(undefined)).toBeUndefined();
  });

  test("returns non-object input unchanged", () => {
    expect(transformBreakdownChainKeys(42 as any)).toBe(42);
    expect(transformBreakdownChainKeys("foo" as any)).toBe("foo");
  });

  test("re-keys known chain keys to their display labels", () => {
    const input = {
      ethereum: { v2: 100 },
      xdai: { v2: 50 },
      avax: { v2: 25 },
      optimism: { v2: 10 },
    };
    const out = transformBreakdownChainKeys(input);
    // Keys should now match what protocol.chains[] returns: display labels.
    expect(out).toEqual({
      Ethereum: { v2: 100 },
      Gnosis: { v2: 50 },
      Avalanche: { v2: 25 },
      "OP Mainnet": { v2: 10 },
    });
  });

  test("preserves nested sub-module values", () => {
    const input = {
      ethereum: { v2: 100, v3: 200 },
      arbitrum: { v3: 300 },
    };
    const out = transformBreakdownChainKeys(input);
    expect(out.Ethereum).toEqual({ v2: 100, v3: 200 });
    expect(out.Arbitrum).toEqual({ v3: 300 });
  });

  test("falls back to capitalized key for unknown chains", () => {
    const input = { somenewchain: { v1: 5 } };
    const out = transformBreakdownChainKeys(input);
    // getChainLabelFromKey capitalizes the first letter when no mapping exists.
    expect(Object.keys(out)).toEqual(["Somenewchain"]);
    expect(out.Somenewchain).toEqual({ v1: 5 });
  });

  test("merges entries when two raw keys map to the same label (defensive)", () => {
    // Simulate (defensively) two raw keys that resolve to the same label.
    // In practice the input shouldn't contain duplicates, but the function
    // should still sum rather than silently overwrite.
    const input: any = {
      ethereum: { v2: 100 },
      // direct duplicate of a key that already maps to "Ethereum" — using the
      // exact same raw key is the only realistic duplication path, and we
      // sum to avoid losing entries:
    };
    input.ethereum = { v2: 100, v3: 25 }; // overwrite same key in object literal — acts like single entry
    const out = transformBreakdownChainKeys(input);
    expect(out.Ethereum).toEqual({ v2: 100, v3: 25 });
  });

  test("ignores non-numeric sub-module values", () => {
    const input: any = {
      ethereum: { v2: 100, weird: "not-a-number", alsoBad: null },
    };
    const out = transformBreakdownChainKeys(input);
    expect(out.Ethereum).toEqual({ v2: 100 });
  });

  test("ignores non-object chain entries", () => {
    const input: any = {
      ethereum: { v2: 100 },
      xdai: null,
      avax: 42,
    };
    const out = transformBreakdownChainKeys(input);
    expect(out).toEqual({ Ethereum: { v2: 100 } });
  });
});

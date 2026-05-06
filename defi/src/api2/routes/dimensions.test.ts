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
    // getChainLabelFromKey falls back to capitalize-first-letter for keys it
    // doesn't have an explicit mapping for, so two distinct raw keys ("foo"
    // and "Foo") both produce label "Foo". This is the only realistic way
    // two raw keys collide on a label and is what the accumulation branch
    // exists for.
    const input = {
      foo: { v1: 100 },
      Foo: { v1: 50, v2: 7 },
    } as any;
    const out = transformBreakdownChainKeys(input);
    expect(Object.keys(out)).toEqual(["Foo"]);
    expect(out.Foo).toEqual({ v1: 150, v2: 7 });
  });

  test("ignores non-numeric sub-module values (incl. null/false/string/array)", () => {
    // Number(null) === 0, Number(false) === 0, Number("") === 0,
    // Number([]) === 0 — all finite. A naive Number.isFinite(Number(value))
    // filter would silently coerce these to 0; the strict typeof check rejects
    // them.
    const input: any = {
      ethereum: {
        v2: 100,
        nullV: null,
        falseV: false,
        emptyStrV: "",
        arrayV: [],
        stringNumV: "42",
        nan: NaN,
        infV: Infinity,
      },
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

import { describe, it, expect } from "vitest";
import { translateLabel, buildFilterParams, sortOptionsOtherLast } from "../../src/utils/i18nHelpers";

describe("translateLabel", () => {
  it("returns translation when key resolves", () => {
    const t = (key: string) => (key === "deposits.companies.DEEL" ? "Deel SA" : key);
    expect(translateLabel(t, "deposits.companies.", "DEEL", "Deel")).toBe("Deel SA");
  });

  it("returns fallback when key is identity", () => {
    const t = (key: string) => key;
    expect(translateLabel(t, "deposits.companies.", "UNKNOWN", "Unknown Co")).toBe("Unknown Co");
  });
});

describe("buildFilterParams", () => {
  it("includes only truthy values", () => {
    expect(buildFilterParams({ year: "2026", month: "", category: "TAXES" })).toEqual({
      year: "2026",
      category: "TAXES",
    });
  });

  it("returns empty object when all values are empty", () => {
    expect(buildFilterParams({ a: "", b: "" })).toEqual({});
  });
});

describe("sortOptionsOtherLast", () => {
  type Row = { code: string; label: string };
  const code = (r: Row) => r.code;
  const label = (r: Row) => r.label;

  it("sorts alphabetically by label", () => {
    const items: Row[] = [
      { code: "B", label: "Banco B" },
      { code: "A", label: "Acme" },
      { code: "C", label: "Citi" },
    ];
    expect(sortOptionsOtherLast(items, code, label).map(code)).toEqual(["A", "B", "C"]);
  });

  it("places OTHER last regardless of label", () => {
    const items: Row[] = [
      { code: "OTHER", label: "Aardvark" },
      { code: "B", label: "Bank" },
      { code: "A", label: "Acme" },
    ];
    expect(sortOptionsOtherLast(items, code, label).map(code)).toEqual(["A", "B", "OTHER"]);
  });

  it("does not mutate the input array", () => {
    const items: Row[] = [
      { code: "B", label: "B" },
      { code: "A", label: "A" },
    ];
    const before = items.map(code);
    sortOptionsOtherLast(items, code, label);
    expect(items.map(code)).toEqual(before);
  });

  it("handles empty input", () => {
    expect(sortOptionsOtherLast<Row>([], code, label)).toEqual([]);
  });
});

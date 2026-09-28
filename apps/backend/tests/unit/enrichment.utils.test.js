const {
  normalizeEnrichmentInput,
  buildEnrichmentResult,
} = require("../../src/modules/enrichment/enrichment.utils");

const { enrichRow, enrichRows } = require("../../src/modules/enrichment/enrichment.service");

describe("enrichment utils", () => {
  test("normalizeEnrichmentInput rejects non-object input", () => {
    expect(() => normalizeEnrichmentInput(null)).toThrow();
    expect(() => normalizeEnrichmentInput("bad")).toThrow();
  });

  test("normalizeEnrichmentInput passes objects through", () => {
    const input = { a: 1 };

    expect(normalizeEnrichmentInput(input)).toBe(input);
  });

  test("buildEnrichmentResult stamps the result with an enrichedAt date", () => {
    const result = buildEnrichmentResult({
      provider: "mock",
      data: { a: 1 },
    });

    expect(result.provider).toBe("mock");
    expect(result.data).toEqual({ a: 1 });
    expect(result.enrichedAt).toBeInstanceOf(Date);
  });
});

describe("enrichment service", () => {
  test("enrichRow returns provider/data/enrichedAt", async () => {
    const result = await enrichRow({ name: "Ada" });

    expect(result.provider).toBe("mock");
    expect(result.data).toEqual({ name: "Ada" });
    expect(result.enrichedAt).toBeInstanceOf(Date);
  });

  test("enrichRows reports per-row success without throwing", async () => {
    const results = await enrichRows([{ a: 1 }, { b: 2 }]);

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.success)).toBe(true);
  });

  test("enrichRows reports failures for invalid rows", async () => {
    const results = await enrichRows([null]);

    expect(results[0].success).toBe(false);
    expect(results[0].error.code).toBe("INVALID_ENRICHMENT_INPUT");
  });
});

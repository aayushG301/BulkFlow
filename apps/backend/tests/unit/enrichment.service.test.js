// These tests isolate the *routing* logic in enrichment.service.js from
// the real HTTP/mock provider implementations (covered separately in
// enrichment.provider.test.js) and from the real parsed env module, so
// they can deterministically exercise both the "key configured" and
// "key missing" branches without touching the network or process.env.

jest.mock("../../src/modules/enrichment/enrichment.provider");

// config/env.js exports a plain object of primitives - automock would
// leave that ambiguous, so this supplies an explicit, mutable stand-in
// that each test can set GEMINI_API_KEY on directly.
jest.mock("../../src/config/env", () => ({
  GEMINI_API_KEY: undefined,
  GEMINI_MODEL: "gemini-1.5-flash",
}));

const env = require("../../src/config/env");
const { enrichWithMock, enrichWithGemini } = require("../../src/modules/enrichment/enrichment.provider");
const { enrichRow, enrichRows } = require("../../src/modules/enrichment/enrichment.service");

describe("enrichment.service - provider routing", () => {
  let warnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    env.GEMINI_API_KEY = undefined;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    enrichWithMock.mockResolvedValue({ provider: "mock", data: { name: "Ada" } });
    enrichWithGemini.mockResolvedValue({ provider: "gemini", data: { name: "Ada", inferredIndustry: "Software" } });
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test("defaults to the mock provider when none is specified", async () => {
    await enrichRow({ name: "Ada" });

    expect(enrichWithMock).toHaveBeenCalledTimes(1);
    expect(enrichWithGemini).not.toHaveBeenCalled();
  });

  test("uses Gemini when requested and an API key is configured", async () => {
    env.GEMINI_API_KEY = "real-key";
    env.GEMINI_MODEL = "gemini-1.5-flash";

    const result = await enrichRow({ name: "Ada" }, "gemini");

    expect(enrichWithGemini).toHaveBeenCalledWith(
      { name: "Ada" },
      { apiKey: "real-key", model: "gemini-1.5-flash" },
    );
    expect(enrichWithMock).not.toHaveBeenCalled();
    expect(result.provider).toBe("gemini");
    expect(result.data.inferredIndustry).toBe("Software");
  });

  test("falls back to mock (with a warning) when Gemini is requested but no key is configured", async () => {
    env.GEMINI_API_KEY = undefined;

    const result = await enrichRow({ name: "Ada" }, "gemini");

    expect(enrichWithMock).toHaveBeenCalledTimes(1);
    expect(enrichWithGemini).not.toHaveBeenCalled();
    expect(result.provider).toBe("mock");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to the mock provider"));
  });

  test("propagates a Gemini failure as a rejected promise (worker decides what to do with it)", async () => {
    env.GEMINI_API_KEY = "real-key";
    const geminiError = Object.assign(new Error("rate limited"), { code: "RESOURCE_EXHAUSTED" });
    enrichWithGemini.mockRejectedValue(geminiError);

    await expect(enrichRow({ name: "Ada" }, "gemini")).rejects.toThrow("rate limited");
  });
});

describe("enrichment.service - enrichRows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
  });

  test("reports per-row success without throwing", async () => {
    enrichWithMock.mockResolvedValue({ provider: "mock", data: { a: 1 } });

    const results = await enrichRows([{ a: 1 }, { b: 2 }]);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  test("reports a failure for a row that fails validation before reaching the provider", async () => {
    const results = await enrichRows([null]);

    expect(results[0].success).toBe(false);
    expect(results[0].error.code).toBe("INVALID_ENRICHMENT_INPUT");
    expect(enrichWithMock).not.toHaveBeenCalled();
  });
});

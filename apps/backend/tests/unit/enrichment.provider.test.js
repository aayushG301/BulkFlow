const { enrichWithMock, enrichWithGemini } = require("../../src/modules/enrichment/enrichment.provider");

const originalFetch = global.fetch;

const geminiOkResponse = (fields = {}) => ({
  ok: true,
  json: async () => ({
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(fields) }],
        },
      },
    ],
  }),
});

const geminiErrorResponse = (status, message = "error", statusText = "ERROR") => ({
  ok: false,
  status,
  json: async () => ({ error: { message, status: statusText } }),
});

describe("enrichment.provider - enrichWithMock", () => {
  test("echoes the input back under provider 'mock'", async () => {
    const result = await enrichWithMock({ name: "Ada" });

    expect(result).toEqual({ provider: "mock", data: { name: "Ada" } });
  });

  test("throws when no data is given", async () => {
    await expect(enrichWithMock(null)).rejects.toThrow("Data is required");
  });
});

describe("enrichment.provider - enrichWithGemini", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test("throws GEMINI_NOT_CONFIGURED when no API key is provided", async () => {
    await expect(
      enrichWithGemini({ name: "Ada" }, { apiKey: undefined, model: "gemini-1.5-flash" }),
    ).rejects.toMatchObject({ code: "GEMINI_NOT_CONFIGURED" });
  });

  test("throws when no data is given", async () => {
    await expect(
      enrichWithGemini(null, { apiKey: "key", model: "gemini-1.5-flash" }),
    ).rejects.toMatchObject({ code: "ENRICHMENT_DATA_REQUIRED" });
  });

  test("sends the record in the prompt and merges inferred fields into the result", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      geminiOkResponse({ normalizedEmail: "ada@example.com", dataQualityNotes: [] }),
    );

    const result = await enrichWithGemini(
      { name: "Ada", email: "ADA@EXAMPLE.COM " },
      { apiKey: "test-key", model: "gemini-1.5-flash" },
    );

    expect(result.provider).toBe("gemini");
    expect(result.data).toEqual({
      name: "Ada",
      email: "ADA@EXAMPLE.COM ",
      normalizedEmail: "ada@example.com",
      dataQualityNotes: [],
    });

    // Confirm the request shape: correct URL (model + key), and the
    // record is embedded in the prompt text sent to Gemini.
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=test-key",
    );
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.contents[0].parts[0].text).toContain('"email":"ADA@EXAMPLE.COM "');
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  test("truncates an unusually large record instead of sending it in full", async () => {
    global.fetch = jest.fn().mockResolvedValue(geminiOkResponse({}));

    const hugeValue = "x".repeat(10000);
    await enrichWithGemini({ notes: hugeValue }, { apiKey: "test-key", model: "gemini-1.5-flash" });

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const promptText = body.contents[0].parts[0].text;

    expect(promptText.length).toBeLessThan(hugeValue.length);
    expect(promptText).toContain("(truncated)");
  });

  test("retries on 429 and succeeds on a later attempt", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(geminiErrorResponse(429, "rate limited", "RESOURCE_EXHAUSTED"))
      .mockResolvedValueOnce(geminiOkResponse({ inferredIndustry: "Software" }));

    const resultPromise = enrichWithGemini(
      { company: "Acme" },
      { apiKey: "test-key", model: "gemini-1.5-flash" },
    );

    const result = await resultPromise;

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.data.inferredIndustry).toBe("Software");
  }, 10000);

  test("converts a hung/aborted request into a retryable GEMINI_TIMEOUT error", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(geminiOkResponse({ inferredIndustry: "Software" }));

    const result = await enrichWithGemini(
      { company: "Acme" },
      { apiKey: "test-key", model: "gemini-1.5-flash" },
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.data.inferredIndustry).toBe("Software");
  }, 10000);

  test("passes an AbortSignal on every request so a hang can't block forever", async () => {
    global.fetch = jest.fn().mockResolvedValue(geminiOkResponse({}));

    await enrichWithGemini({ company: "Acme" }, { apiKey: "test-key", model: "gemini-1.5-flash" });

    const [, options] = global.fetch.mock.calls[0];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  test("gives up after exhausting retries on persistent 503s", async () => {
    global.fetch = jest.fn().mockResolvedValue(geminiErrorResponse(503, "overloaded", "UNAVAILABLE"));

    await expect(
      enrichWithGemini({ company: "Acme" }, { apiKey: "test-key", model: "gemini-1.5-flash" }),
    ).rejects.toMatchObject({ status: 503 });

    // 1 initial attempt + 3 retries = 4 calls
    expect(global.fetch).toHaveBeenCalledTimes(4);
  }, 10000);

  test("does not retry on a non-retryable 400 error", async () => {
    global.fetch = jest.fn().mockResolvedValue(geminiErrorResponse(400, "bad request", "INVALID_ARGUMENT"));

    await expect(
      enrichWithGemini({ company: "Acme" }, { apiKey: "test-key", model: "gemini-1.5-flash" }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_ARGUMENT" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("throws GEMINI_EMPTY_RESPONSE when there is no candidate text", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });

    await expect(
      enrichWithGemini({ company: "Acme" }, { apiKey: "test-key", model: "gemini-1.5-flash" }),
    ).rejects.toMatchObject({ code: "GEMINI_EMPTY_RESPONSE" });
  });

  test("throws GEMINI_INVALID_JSON when the model doesn't return parseable JSON", async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: "not json" }] } }],
        }),
      }),
    );

    await expect(
      enrichWithGemini({ company: "Acme" }, { apiKey: "test-key", model: "gemini-1.5-flash" }),
    ).rejects.toMatchObject({ code: "GEMINI_INVALID_JSON" });
  });
});

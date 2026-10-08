// ----------------------------------------
// Mock Provider
// ----------------------------------------
// Used whenever enrichment is enabled but no real provider is
// configured (or none was selected). Deliberately does not add any
// information - it exists so the enrichment pipeline has something
// predictable to exercise end-to-end.
const enrichWithMock = async (data) => {
  if (!data) {
    const error = new Error("Data is required for enrichment");

    error.code = "ENRICHMENT_DATA_REQUIRED";

    throw error;
  }

  return {
    provider: "mock",
    data: {
      ...data,
    },
  };
};

// ----------------------------------------
// Gemini Provider
// ----------------------------------------
// Calls Google's Generative Language API to infer additional fields
// for a row (normalized email/phone, a likely industry, data-quality
// notes). Only fields Gemini can confidently infer are added - nothing
// here invents data that wasn't derivable from the input.

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;
const REQUEST_TIMEOUT_MS = 15000;
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Keeps one unusually large field (a long free-text column, say) from
// blowing up the prompt size/cost for what is meant to be a short
// per-row enrichment call.
const MAX_PROMPT_RECORD_CHARS = 4000;

const buildEnrichmentPrompt = (data) => {
  let serializedRecord = JSON.stringify(data);

  if (serializedRecord.length > MAX_PROMPT_RECORD_CHARS) {
    serializedRecord = `${serializedRecord.slice(0, MAX_PROMPT_RECORD_CHARS)}... (truncated)`;
  }

  return [
    "You are a data-enrichment assistant for a bulk contact/record import pipeline.",
    "Given the JSON record below, infer and return ONLY fields you can genuinely",
    "determine from the input - never guess or invent a value.",
    "",
    "Return a single raw JSON object (no markdown, no code fences, no explanation)",
    "that may include any of these optional fields when inferable:",
    '- "normalizedEmail": a cleaned/lowercased version of the email, if present',
    '- "normalizedPhone": the phone number in E.164-like format, if a phone field is present',
    '- "inferredIndustry": a likely industry for the company name, if a company field is present',
    '- "dataQualityNotes": an array of short strings flagging anything suspicious',
    "",
    "Omit any field you cannot confidently infer. If nothing can be inferred, return {}.",
    "",
    "Record:",
    serializedRecord,
  ].join("\n");
};

const parseGeminiResponse = (payload) => {
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const error = new Error("Gemini response did not include any content");

    error.code = "GEMINI_EMPTY_RESPONSE";

    throw error;
  }

  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Gemini response was not valid JSON");

    error.code = "GEMINI_INVALID_JSON";

    throw error;
  }
};

// Calls the Gemini REST API, retrying with exponential backoff on rate
// limit (429) and transient server (5xx) errors only.
const callGeminiWithRetry = async ({ apiKey, model, prompt }) => {
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    let response;

    // A hung connection must not be allowed to stall this row forever -
    // rows are processed one at a time, so a single stuck request would
    // otherwise block the entire job.
    const timeoutController = new AbortController();
    const timeoutHandle = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        signal: timeoutController.signal,
      });
    } catch (networkError) {
      lastError =
        networkError.name === "AbortError"
          ? Object.assign(new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`), {
              code: "GEMINI_TIMEOUT",
            })
          : networkError;

      if (attempt === MAX_RETRIES) break;

      await sleep(BASE_BACKOFF_MS * 2 ** attempt);
      continue;
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (response.ok) {
      return response.json();
    }

    const errorBody = await response.json().catch(() => null);

    const error = new Error(
      errorBody?.error?.message || `Gemini request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.code = errorBody?.error?.status || "GEMINI_REQUEST_FAILED";

    if (!RETRYABLE_STATUS_CODES.includes(response.status) || attempt === MAX_RETRIES) {
      throw error;
    }

    lastError = error;
    await sleep(BASE_BACKOFF_MS * 2 ** attempt);
  }

  throw lastError;
};

const enrichWithGemini = async (data, { apiKey, model }) => {
  if (!data) {
    const error = new Error("Data is required for enrichment");

    error.code = "ENRICHMENT_DATA_REQUIRED";

    throw error;
  }

  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");

    error.code = "GEMINI_NOT_CONFIGURED";

    throw error;
  }

  const prompt = buildEnrichmentPrompt(data);
  const payload = await callGeminiWithRetry({ apiKey, model, prompt });
  const enrichedFields = parseGeminiResponse(payload);

  return {
    provider: "gemini",
    data: {
      ...data,
      ...enrichedFields,
    },
  };
};

module.exports = {
  enrichWithMock,
  enrichWithGemini,
};

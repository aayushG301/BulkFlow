// Dashboard aggregation itself needs a real MongoDB (covered in
// tests/integration/dashboard.test.js). This isolates just the new
// "is Gemini actually configured" status field, which is pure env
// logic, by mocking out every DB call.

jest.mock("../../src/modules/jobs/job.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue([]),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock("../../src/modules/uploads/upload.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock("../../src/config/env", () => ({
  GEMINI_API_KEY: undefined,
  GEMINI_MODEL: "gemini-1.5-flash",
}));

const env = require("../../src/config/env");
const { getDashboard } = require("../../src/modules/dashboard/dashboard.service");

describe("dashboard.service - enrichment status", () => {
  test("reports geminiConfigured: false when no API key is set", async () => {
    env.GEMINI_API_KEY = undefined;

    const data = await getDashboard("user-1");

    expect(data.enrichment).toEqual({
      geminiConfigured: false,
      geminiModel: "gemini-1.5-flash",
    });
  });

  test("reports geminiConfigured: true once an API key is set", async () => {
    env.GEMINI_API_KEY = "a-real-key";

    const data = await getDashboard("user-1");

    expect(data.enrichment.geminiConfigured).toBe(true);
  });
});

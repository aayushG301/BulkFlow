const {
  calculateProgress,
  calculateRemainingRows,
  determineJobStatus,
  validateProcessingData,
} = require("../../src/modules/processing/processing.utils");

const { processRow } = require("../../src/modules/processing/processing.service");

describe("processing utils", () => {
  test("calculateProgress returns 0 when there are no rows", () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  test("calculateProgress rounds to the nearest percent and caps at 100", () => {
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(10, 5)).toBe(100);
  });

  test("calculateRemainingRows never goes negative", () => {
    expect(calculateRemainingRows(3, 10)).toBe(7);
    expect(calculateRemainingRows(15, 10)).toBe(0);
  });

  test("determineJobStatus reflects whether any rows failed", () => {
    expect(determineJobStatus(0)).toBe("completed");
    expect(determineJobStatus(2)).toBe("completed_with_errors");
  });

  test("validateProcessingData rejects non-object data", () => {
    expect(() => validateProcessingData(null)).toThrow();
    expect(() => validateProcessingData("not an object")).toThrow();
    expect(validateProcessingData({ a: 1 })).toBe(true);
  });
});

describe("processing service - processRow", () => {
  test("throws when no row is provided", async () => {
    await expect(processRow(undefined)).rejects.toThrow("Row is required");
  });

  test("copies originalData into processedData", async () => {
    const result = await processRow({ originalData: { name: "Ada" } });

    expect(result.processedData).toEqual({ name: "Ada" });
  });

  test("rejects rows whose data is not an object", async () => {
    await expect(processRow({ originalData: "nope" })).rejects.toThrow();
  });
});

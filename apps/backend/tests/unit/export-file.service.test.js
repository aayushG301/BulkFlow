const fs = require("fs/promises");
const path = require("path");

const { createCSVFile } = require("../../src/services/export-file.service");

describe("export-file.service - createCSVFile", () => {
  const createdFiles = [];

  afterAll(async () => {
    await Promise.all(
      createdFiles.map((filePath) => fs.unlink(filePath).catch(() => {})),
    );
  });

  test("throws when results is not an array", async () => {
    await expect(createCSVFile("not-an-array", "job123")).rejects.toThrow(
      "Results must be an array",
    );
  });

  test("writes a CSV file with a header row derived from result data", async () => {
    const results = [
      {
        rowNum: 1,
        status: "completed",
        originalData: { name: "Ada", email: "ada@example.com" },
        processedData: { name: "Ada Lovelace", email: "ada@example.com" },
      },
      {
        rowNum: 2,
        status: "failed",
        originalData: { name: "Alan", email: "alan@example.com" },
        processedData: null,
      },
    ];

    const file = await createCSVFile(results, "job123");

    createdFiles.push(file.filePath);

    const content = await fs.readFile(file.filePath, "utf8");
    const lines = content.split("\n");

    expect(file.fileName).toMatch(/^bulkflow-export-job123-\d+\.csv$/);
    expect(lines[0]).toBe("rowNum,status,name,email");
    expect(lines[1]).toBe("1,completed,Ada Lovelace,ada@example.com");
    // Row 2 has no processedData, so it should fall back to originalData
    expect(lines[2]).toBe("2,failed,Alan,alan@example.com");
  });

  test("escapes values containing commas, quotes, and newlines", async () => {
    const results = [
      {
        rowNum: 1,
        status: "completed",
        originalData: { note: 'Contains, a "quote" and\na newline' },
        processedData: null,
      },
    ];

    const file = await createCSVFile(results, "job456");

    createdFiles.push(file.filePath);

    const content = await fs.readFile(file.filePath, "utf8");

    expect(content).toContain('"Contains, a ""quote"" and\na newline"');
  });

  test("writes into the exports directory under the current working directory", async () => {
    const results = [
      {
        rowNum: 1,
        status: "completed",
        originalData: { a: "1" },
        processedData: null,
      },
    ];

    const file = await createCSVFile(results, "job789");

    createdFiles.push(file.filePath);

    const expectedDirectory = path.resolve(process.cwd(), "exports");

    expect(path.dirname(file.filePath)).toBe(expectedDirectory);
  });
});

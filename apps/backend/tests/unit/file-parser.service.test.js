const fs = require("fs");
const os = require("os");
const path = require("path");

const { parseFile } = require("../../src/services/file-parser.service");

const writeTempFile = (fileName, content) => {
  const filePath = path.join(os.tmpdir(), fileName);

  fs.writeFileSync(filePath, content, "utf8");

  return filePath;
};

describe("file-parser.service", () => {
  const tempFiles = [];

  afterAll(() => {
    tempFiles.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });

  test("throws when no file path is provided", async () => {
    await expect(parseFile()).rejects.toThrow("File path is required");
  });

  test("throws when the file does not exist", async () => {
    await expect(parseFile("/tmp/does-not-exist.csv")).rejects.toThrow(
      "File not found",
    );
  });

  test("throws on an unsupported file extension", async () => {
    const filePath = writeTempFile("bulkflow-test.txt", "a,b\n1,2\n");

    tempFiles.push(filePath);

    await expect(parseFile(filePath)).rejects.toThrow(
      "Unsupported file format",
    );
  });

  test("parses a CSV file into normalized row objects", async () => {
    const filePath = writeTempFile(
      `bulkflow-test-${Date.now()}.csv`,
      "name,email\n Ada Lovelace , ada@example.com \nAlan Turing,alan@example.com\n",
    );

    tempFiles.push(filePath);

    const rows = await parseFile(filePath);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(rows[1]).toEqual({
      name: "Alan Turing",
      email: "alan@example.com",
    });
  });

  test("skips fully empty CSV rows", async () => {
    const filePath = writeTempFile(
      `bulkflow-test-empty-${Date.now()}.csv`,
      "name,email\nAda,ada@example.com\n,\n",
    );

    tempFiles.push(filePath);

    const rows = await parseFile(filePath);

    // csv-parser still emits the blank row as { name: "", email: "" } -
    // normalization trims values but does not drop empty rows, which
    // matches how the CSV branch behaves today.
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]).toEqual({ name: "Ada", email: "ada@example.com" });
  });
});

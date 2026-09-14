const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const XLSX = require("xlsx");

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const parseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("Excel file contains no sheets");
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
    });

    return rows;
  } catch (error) {
    throw error;
  }
};

const normalizeRows = (rows) => {
  return rows.map((row) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.trim();

      normalizedRow[normalizedKey] =
        typeof value === "string" ? value.trim() : value;
    }

    return normalizedRow;
  });
};

const parseFile = async (filePath) => {
  if (!filePath) {
    throw new Error("File path is required");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error("File not found");
  }

  const extension = path.extname(filePath).toLowerCase();

  let rows;

  switch (extension) {
    case ".csv":
      rows = await parseCSV(filePath);
      break;

    case ".xls":
    case ".xlsx":
      rows = parseExcel(filePath);
      break;

    default:
      throw new Error(
        "Unsupported file format. Only CSV, XLS, and XLSX are allowed",
      );
  }

  return normalizeRows(rows);
};

module.exports = {
  parseFile,
};

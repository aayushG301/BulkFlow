const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const ExcelJS = require("@andreeewill/exceljs");

// ----------------------------------------
// Parse CSV
// ----------------------------------------

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

// ----------------------------------------
// Parse XLSX
// ----------------------------------------

const parseXLSX = async (filePath) => {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("Excel file contains no worksheets");
  }

  if (worksheet.rowCount < 1) {
    return [];
  }

  const headerRow = worksheet.getRow(1);

  const headers = [];

  headerRow.eachCell(
    {
      includeEmpty: true,
    },
    (cell, columnNumber) => {
      const header = cell.value;

      headers[columnNumber - 1] =
        header === null || header === undefined
          ? `column_${columnNumber}`
          : String(header).trim();
    },
  );

  const rows = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    const parsedRow = {};

    for (let columnNumber = 1; columnNumber <= headers.length; columnNumber++) {
      const header = headers[columnNumber - 1];

      if (!header) {
        continue;
      }

      const cell = row.getCell(columnNumber);

      parsedRow[header] = normalizeExcelValue(cell.value);
    }

    const hasData = Object.values(parsedRow).some(
      (value) => value !== null && value !== undefined && value !== "",
    );

    if (hasData) {
      rows.push(parsedRow);
    }
  }

  return rows;
};

// ----------------------------------------
// Normalize Excel Values
// ----------------------------------------

const normalizeExcelValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if ("result" in value) {
      return value.result;
    }

    if ("text" in value) {
      return value.text;
    }

    if ("richText" in value) {
      return value.richText.map((item) => item.text || "").join("");
    }

    return JSON.stringify(value);
  }

  return value;
};

// ----------------------------------------
// Normalize Rows
// ----------------------------------------

const normalizeRows = (rows) => {
  return rows.map((row) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = String(key).trim();

      normalizedRow[normalizedKey] =
        typeof value === "string" ? value.trim() : value;
    }

    return normalizedRow;
  });
};

// ----------------------------------------
// Parse File
// ----------------------------------------

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

    case ".xlsx":
      rows = await parseXLSX(filePath);
      break;

    default:
      throw new Error(
        "Unsupported file format. Only CSV and XLSX files are currently supported",
      );
  }

  return normalizeRows(rows);
};

module.exports = {
  parseFile,
};

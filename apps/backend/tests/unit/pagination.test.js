const {
  getPagination,
  buildPaginationMeta,
} = require("../../src/utils/pagination");

describe("pagination utils", () => {
  describe("getPagination", () => {
    test("falls back to defaults when nothing is provided", () => {
      const result = getPagination();

      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    test("computes skip from page and limit", () => {
      const result = getPagination({ page: 3, limit: 10 });

      expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    test("rejects invalid page/limit values and falls back to defaults", () => {
      const result = getPagination({ page: -1, limit: "not-a-number" });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    test("caps limit at the maximum allowed value", () => {
      const result = getPagination({ page: 1, limit: 500 });

      expect(result.limit).toBe(100);
    });
  });

  describe("buildPaginationMeta", () => {
    test("computes total pages and next/previous flags", () => {
      const meta = buildPaginationMeta({ page: 2, limit: 10, total: 25 });

      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    test("reports no pages when there are no results", () => {
      const meta = buildPaginationMeta({ page: 1, limit: 10, total: 0 });

      expect(meta.totalPages).toBe(0);
      expect(meta.hasNextPage).toBe(false);
      expect(meta.hasPreviousPage).toBe(false);
    });
  });
});

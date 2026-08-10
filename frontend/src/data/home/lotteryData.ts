import type {
  Latest2DResult,
  Latest3DResult,
  Result2D,
  Result3D,
} from "@/types/lottery";

/* ============================================================
   WEEK DATES
   ============================================================ */

export const weekDates = [
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
];

export const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/* ============================================================
   2D RESULTS
   ============================================================ */

export const twoDResults: Record<
  string,
  {
    morning: Result2D;
    evening: Result2D;
  }
> = {
  "2026-08-03": {
    morning: {
      result: "08",
      setValue: "223.34",
      value: "90.12",
    },
    evening: {
      result: "74",
      setValue: "112.23",
      value: "89.01",
    },
  },

  "2026-08-04": {
    morning: {
      result: "19",
      setValue: "901.23",
      value: "78.90",
    },
    evening: {
      result: "63",
      setValue: "890.12",
      value: "67.89",
    },
  },

  "2026-08-05": {
    morning: {
      result: "45",
      setValue: "789.01",
      value: "56.78",
    },
    evening: {
      result: "81",
      setValue: "678.90",
      value: "34.56",
    },
  },

  "2026-08-06": {
    morning: {
      result: "36",
      setValue: "567.89",
      value: "23.45",
    },
    evening: {
      result: "92",
      setValue: "345.67",
      value: "78.90",
    },
  },

  "2026-08-07": {
    morning: {
      result: "14",
      setValue: "234.56",
      value: "45.67",
    },
    evening: {
      result: "58",
      setValue: "456.78",
      value: "12.34",
    },
  },
};

/* ============================================================
   3D RESULTS
   ============================================================ */

export const threeDDraws: Record<string, Result3D> = {
  "2026-08-03": {
    result: "428",
  },

  "2026-08-17": {
    result: "562",
  },

  "2026-09-01": {
    result: "731",
  },

  "2026-09-16": {
    result: "284",
  },

  "2026-10-01": {
    result: "915",
  },

  "2026-10-16": {
    result: "367",
  },
};

/* ============================================================
   3D DRAW DATES
   ============================================================ */

export const threeDDrawDates = [
  "2026-08-03",
  "2026-08-17",
  "2026-09-01",
  "2026-09-16",
  "2026-10-01",
  "2026-10-16",
];

/* ============================================================
   LATEST 2D RESULTS
   ============================================================ */

export const latest2DResults: Latest2DResult[] = [
  {
    id: 1,
    date: "2026-08-07",
    session: "PM",
    result: "58",
  },

  {
    id: 2,
    date: "2026-08-07",
    session: "AM",
    result: "14",
  },
];

/* ============================================================
   LATEST 3D RESULTS
   ============================================================ */

export const latest3DResults: Latest3DResult[] = [
  {
    id: 1,
    date: "2026-08-03",
    result: "428",
  },

  {
    id: 2,
    date: "2026-07-16",
    result: "615",
  },

  {
    id: 3,
    date: "2026-07-01",
    result: "392",
  },
];

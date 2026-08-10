export type Session2D = "AM" | "PM";

export interface Result2D {
  result: string;
  setValue: string;
  value: string;
}

export interface Result3D {
  result: string;
}

export interface Weekly2D {
  date: string;
  day: string;
  morning: Result2D | null;
  evening: Result2D | null;
}

export interface ThreeDDraw {
  date: string;
  day: string;
  result: string | null;
}

export interface PublicHoliday {
  date: string;
  day: string;
  name: string;
}

export interface Latest2DResult {
  id: number;
  date: string;
  session: Session2D;
  result: string;
}

export interface Latest3DResult {
  id: number;
  date: string;
  result: string;
}

export type ResultStatus = "Published" | "Draft";

export type ResultDrawType = "2D" | "3D";

export type ResultSession = "AM" | "PM";

export interface Result {
  id: string;
  drawDate: string;
  drawType: ResultDrawType;
  session: ResultSession | null;
  winningNumber: string;
  status: ResultStatus;
  createdBy: string;
  note?: string | null;
}

export const initialResult: Result = {
  id: "",
  drawDate: "",
  drawType: "2D",
  session: "AM",
  winningNumber: "",
  status: "Draft",
  createdBy: "admin",
  note: "",
};

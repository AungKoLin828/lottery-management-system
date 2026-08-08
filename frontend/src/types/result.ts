export interface Result {
  id: number;
  drawDate: string;
  drawType: "2D" | "3D";
  session: "AM" | "PM";
  winningNumber: string;
  status: "Published" | "Draft";
  createdBy: string;
}

export const initialResult: Result = {
  id: 0,
  drawDate: "",
  drawType: "2D",
  session: "AM",
  winningNumber: "",
  status: "Published",
  createdBy: "admin",
};
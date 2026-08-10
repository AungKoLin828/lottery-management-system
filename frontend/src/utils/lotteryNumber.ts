export function generateRandom2D(): string {
  return Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
}

export function generateRandom3D(): string {
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
}

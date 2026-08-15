import { jwtVerify, SignJWT } from "jose";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

const secret = new TextEncoder().encode(jwtSecret);

export type UserRole = "ADMIN" | "PLAYER";

export interface AuthUser {
  id: string;
  role: UserRole;
}

export async function createToken(
  user: AuthUser,
): Promise<string> {
  return new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string,
): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secret);

  if (!payload.sub) {
    throw new Error("Invalid token");
  }

  if (
    payload.role !== "ADMIN" &&
    payload.role !== "PLAYER"
  ) {
    throw new Error("Invalid role");
  }

  return {
    id: payload.sub,
    role: payload.role as UserRole,
  };
}

export function getAuthCookie(
  token: string,
): string {
  return [
    `auth_token=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Secure",
    "Max-Age=604800",
  ].join("; ");
}

export function clearAuthCookie(): string {
  return [
    "auth_token=",
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Secure",
    "Max-Age=0",
  ].join("; ");
}

export function getTokenFromCookie(
  cookieHeader?: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name === "auth_token") {
      return valueParts.join("=") || null;
    }
  }

  return null;
}

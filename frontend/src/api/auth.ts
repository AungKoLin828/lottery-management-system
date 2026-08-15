export interface AuthUser {
  id: string;
  username: string;
  fullName: string | null;
  phone: string;
  role: "ADMIN" | "PLAYER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isVerified: boolean;
}

interface AuthResponse {
  success: boolean;
  message: string;

  data?: {
    user: AuthUser;
  };
}

export async function login(
  phone: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch(
    "/api/auth/login",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        phone,
        password,
      }),
    },
  );

  const data =
    (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Login failed",
    );
  }

  return data;
}

export async function register(
  name: string,
  phone: string,
  password: string,
  confirmPassword: string,
): Promise<AuthResponse> {
  const response = await fetch(
    "/api/auth/register",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        name,
        phone,
        password,
        confirmPassword,
      }),
    },
  );

  const data =
    (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Registration failed",
    );
  }

  return data;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(
    "/api/auth/me",
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (response.status === 401) {
    return null;
  }

  const data =
    (await response.json()) as AuthResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to get user",
    );
  }

  return data.data?.user ?? null;
}

export async function logout(): Promise<void> {
  const response = await fetch(
    "/api/auth/logout",
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(
      "Logout failed",
    );
  }
}
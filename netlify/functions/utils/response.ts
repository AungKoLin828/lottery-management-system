import type { HandlerResponse } from "@netlify/functions";

export function successResponse(
  data: unknown,
  statusCode = 200,
): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}

export function errorResponse(
  message: string,
  statusCode = 400,
): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      success: false,
      message,
    }),
  };
}

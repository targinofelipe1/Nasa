import { NextRequest } from "next/server";

export function getBaseUrl(req: NextRequest) {
  const host = req.headers.get('host');
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  return baseUrl
}
import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json(
    {
      message: "Logout successful",
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );

  // Delete authentication Cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: false,
  });

  return response;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
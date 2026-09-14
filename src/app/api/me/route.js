import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export function GET(request) {
  const user = verifyJWT(request);

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized Request",
      },
      {
        status: 401,
        headers: corsHeaders,
      }
    );
  }

  return NextResponse.json(
    {
      user: user,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
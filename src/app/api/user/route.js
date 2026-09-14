
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";

import { isAdmin } from "@/lib/auth";
import corsHeaders from "@/lib/cors";

import {
  errorResponse,
  printExceptionLog,
  successResponse,
} from "@/lib/utils";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  if (!isAdmin(request)) {
    return errorResponse("Unauthorized Request", 403);
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(
    Number(searchParams.get("page") || "1") - 1,
    0
  );

  const size = 10;

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const result = await db
      .collection("user")
      .find({}, { projection: { password: 0 } })
      .skip(page * size)
      .limit(size)
      .toArray();

    return successResponse(
      {
        users: result,
        page,
        size,
      },
      200
    );
  } catch (error) {
    printExceptionLog("GET User", error);
    return errorResponse("GET User Internal Error", 500);
  }
}

export async function POST(request) {
  if (!isAdmin(request)) {
    return errorResponse("Unauthorized Request", 403);
  }

  try {
    const data = await request.json();

    const {
      username,
      email,
      password,
      firstname,
      lastname,
    } = data;

    if (!username || !email || !password) {
      return errorResponse("Missing mandatory data", 400);
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const existingUser = await db.collection("user").findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return errorResponse("Username or email already exists", 409);
    }

    const result = await db.collection("user").insertOne({
      username,
      email,
      firstname: firstname || "",
      lastname: lastname || "",
      password: await bcrypt.hash(password, 12),
      status: "ACTIVE",
    });

    return successResponse({ id: result.insertedId }, 201);
  } catch (error) {
    printExceptionLog("POST User", error);
    return errorResponse("POST User Internal Error", 500);
  }
}
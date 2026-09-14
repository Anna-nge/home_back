
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";
import { isAuthenticated } from "@/lib/auth";

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
  if (!isAuthenticated(request)) {
    return errorResponse("Unauthorized Request", 401);
  }

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const itemList = await db
      .collection("item")
      .find({})
      .toArray();

    return successResponse({ itemList }, 200);
  } catch (error) {
    printExceptionLog("GET Items", error);
    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function POST(request) {
  if (!isAuthenticated(request)) {
    return errorResponse("Unauthorized Request", 401);
  }

  try {
    const data = await request.json();

    const { name, category, price, amount } = data;

    if (!name || !category || price === undefined || amount === undefined) {
      return errorResponse("Missing mandatory data", 400);
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const insertResult = await db.collection("item").insertOne({
      name,
      category,
      price,
      amount,
      status: "ACTIVE",
    });

    return successResponse(
      { id: insertResult.insertedId },
      201
    );
  } catch (error) {
    printExceptionLog("POST Items", error);
    return errorResponse("POST Item Internal Error", 500);
  }
}
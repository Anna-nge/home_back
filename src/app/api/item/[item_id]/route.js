
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import { isAuthenticated } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
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

function validObjectId(id) {
  return ObjectId.isValid(id);
}

export async function GET(request, { params }) {
  if (!isAuthenticated(request)) {
    return errorResponse("Unauthorized Request", 401);
  }

  const { item_id } = await params;

  if (!validObjectId(item_id)) {
    return errorResponse("Invalid item id", 400);
  }

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const item = await db.collection("item").findOne({
      _id: new ObjectId(item_id),
    });

    if (!item) {
      return errorResponse("Item not found", 404);
    }

    return successResponse({ item }, 200);
  } catch (error) {
    printExceptionLog("GET Item Exception", error);
    return errorResponse("GET Item Internal Error", 500);
  }
}

export async function DELETE(request, { params }) {
  if (!isAuthenticated(request)) {
    return errorResponse("Unauthorized Request", 401);
  }

  const { item_id } = await params;

  if (!validObjectId(item_id)) {
    return errorResponse("Invalid item id", 400);
  }

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const deleteResult = await db.collection("item").updateOne(
      { _id: new ObjectId(item_id) },
      { $set: { status: "DELETED" } }
    );

    if (deleteResult.matchedCount === 0) {
      return errorResponse("Item not found", 404);
    }

    await writeAuditLog(request, {
      action: "ITEM_DELETE",
      entity: "item",
      entityId: item_id,
    });

    return successResponse({ message: "Delete Success" }, 200);
  } catch (error) {
    printExceptionLog("DELETE Item Exception", error);
    return errorResponse("DELETE Item Internal Error", 500);
  }
}

export async function PUT(request, { params }) {
  if (!isAuthenticated(request)) {
    return errorResponse("Unauthorized Request", 401);
  }

  const { item_id } = await params;

  if (!validObjectId(item_id)) {
    return errorResponse("Invalid item id", 400);
  }

  try {
    const data = await request.json();

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const storedItem = await db.collection("item").findOne({
      _id: new ObjectId(item_id),
    });

    if (!storedItem) {
      return errorResponse("Item not found", 404);
    }

    const updatedFields = {
      name: data.name,
      category: data.category,
      price: data.price,
      amount: data.amount,
    };

    const updatedResult = await db.collection("item").updateOne(
      { _id: new ObjectId(item_id) },
      { $set: updatedFields }
    );

    if (updatedResult.matchedCount === 0) {
      return errorResponse("Item update failed", 400);
    }

    await writeAuditLog(request, {
      action: "ITEM_UPDATE",
      entity: "item",
      entityId: item_id,
      details: updatedFields,
    });

    return successResponse(
      { message: "Item update success" },
      200
    );
  } catch (error) {
    printExceptionLog("PUT Item Exception", error);
    return errorResponse("PUT Item Internal Error", 500);
  }
}
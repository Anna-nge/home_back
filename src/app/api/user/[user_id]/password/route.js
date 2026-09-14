import { getClientPromise } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import corsHeaders from "@/lib/cors";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Admin-only: set a new password for the given user.
export async function PUT(request, { params }) {
  if (!isAdmin(request)) {
    return errorResponse("Unauthorized Request", 403);
  }

  const { user_id } = await params;

  try {
    const data = await request.json();
    const newPassword = data.newPassword;

    if (!newPassword || String(newPassword).length < 8) {
      return errorResponse(
        "Password must be at least 8 characters",
        400
      );

    }

    let objectId;
    try {
      objectId = new ObjectId(user_id);
    } catch {
      return errorResponse("Invalid user id", 400);
    }

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const hashed = await bcrypt.hash(newPassword, 12);

    const updateResult = await db
      .collection("user")
      .updateOne({ _id: objectId }, { $set: { password: hashed } });

    if (updateResult.matchedCount === 0) {
      return errorResponse("User not found", 404);
    }

    await writeAuditLog(request, {
      action: "USER_PASSWORD_CHANGE",
      entity: "user",
      entityId: user_id,
    });

    return successResponse(
      { message: "Password updated successfully" },
      200
    );

  } catch (error) {
    printExceptionLog("PUT User Password Exception", error);

    return errorResponse("PUT User Password Internal Error", 500);
  }
}
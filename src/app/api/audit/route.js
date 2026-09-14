import { getClientPromise } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";
import { errorResponse, printExceptionLog, successResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Admin-only: recent audit log entries, newest first.
export async function GET(request) {
  if (!isAdmin(request)) {
    return errorResponse("Unauthorized Request", 403);
  }

  try {
    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    const logs = await db
      .collection("audit_log")
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return successResponse({ logs }, 200);
  } catch (error) {
    printExceptionLog("GET Audit Log", error);


    return errorResponse("GET Audit Log Internal Error", 500);
  }
}
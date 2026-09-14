
import { getClientPromise } from "./mongodb";

import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./constant";

export async function writeAuditLog(
  request,
  { action, entity, entityId, details }
) {
  try {
    const headers = request.headers;

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    await db.collection("audit_log").insertOne({
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      details: details || null,
      userId: headers.get(X_HEADER_USER_ID) || null,
      username: headers.get(X_HEADER_USER_NAME) || null,
      userEmail: headers.get(X_HEADER_USER_EMAIL) || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.log("==> Write Audit Log Exception");
    console.log(error);
  }
}
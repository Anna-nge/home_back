import { getClientPromise } from "./mongodb";
import {
  X_HEADER_USER_EMAIL,
  X_HEADER_USER_ID,
  X_HEADER_USER_NAME,
} from "./constant";

// Writes one audit log entry. Reads the identity headers that proxy.js
// already attaches after verifying the JWT, so the acting user cannot be
// spoofed by the client. Never throws — a logging failure must not break
// the action being audited.
export async function writeAuditLog(request, { action, entity, entityId, details }) {
  try {
    const headers = request.headers;

    const client = await getClientPromise();
    const db = client.db(process.env.DB_NAME);

    await db.collection("audit_log").insertOne({
      action, // e.g. "ITEM_CREATE", "ITEM_UPDATE", "ITEM_DELETE"
      entity, // e.g. "item"
      entityId: entityId ? String(entityId) : null,
      details: details || null,
      userId: headers.get(X_HEADER_USER_ID) || null,
      username: headers.get(X_HEADER_USER_NAME) || null,
      userEmail: headers.get(X_HEADER_USER_EMAIL) || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.log("==>Write Audit Log Exception");
    console.log(error);
  }

}
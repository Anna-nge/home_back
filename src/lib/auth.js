import jwt from "jsonwebtoken";
import { X_HEADER_USER_ID } from "./constant";

const JWT_SECRET = process.env.JWT_SECRET;

// Verify the JWT token from the cookies
export function verifyJWT(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    return decoded;
  } catch (error) {
    console.error("==> Verify Token Exception:", error);
    return null;
  }
}

// Check whether the user is an administrator
export function isAdmin(request) {
  const userId = Number(request.headers.get(X_HEADER_USER_ID));

  return userId === -1;
}
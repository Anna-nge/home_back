
import jwt from "jsonwebtoken";
import { X_HEADER_USER_ID } from "./constant";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyJWT(request) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token || !JWT_SECRET) {
      return null;
    }

    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.log("==> Verify Token Exception");
    console.log(error.message);
    return null;
  }
}

export function isAuthenticated(request) {
  return verifyJWT(request) !== null;
}

export function isAdmin(request) {
  const user = verifyJWT(request);

  if (!user) {
    return false;
  }

  return String(user.id) === "-1";
}
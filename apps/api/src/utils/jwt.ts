import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_strong";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "change_me_refresh";

export function signAccessToken(payload: { userId: string; email: string; role: UserRole }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: { userId: string }) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: UserRole };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
}

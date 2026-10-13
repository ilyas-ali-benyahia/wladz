import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const sessionCookie = "wladz_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type PublicUser = Pick<UserRow, "id" | "email" | "created_at">;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex || !/^[a-f0-9]+$/i.test(saltHex + hashHex)) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  if (salt.length !== 16 || expectedHash.length !== 64) return false;

  const actualHash = (await scrypt(password, salt, expectedHash.length)) as Buffer;
  return timingSafeEqual(actualHash, expectedHash);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionLifetimeSeconds * 1000;

  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashSessionToken(token), userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return null;

  const user = db
    .prepare(
      `SELECT users.id, users.email, users.created_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashSessionToken(token), Date.now()) as PublicUser | undefined;

  return user ?? null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
      hashSessionToken(token),
    );
  }
  cookieStore.delete(sessionCookie);
}

export function createUserId() {
  return randomUUID();
}

export function findUserByEmail(email: string) {
  return db
    .prepare(
      "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
    )
    .get(email) as UserRow | undefined;
}

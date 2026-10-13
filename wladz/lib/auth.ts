import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const sessionCookie = "wladz_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

type UserRow = {
  id: string;
  full_name: string;
  birth_date: string;
  parent_phone: string;
  password_hash: string;
  points: number;
  created_at: string;
};

export type PublicUser = Pick<
  UserRow,
  "id" | "full_name" | "birth_date" | "points" | "created_at"
>;

// Réservé à la page de profil de l'enfant connecté : contient le numéro du parent.
export type UserProfile = PublicUser & Pick<UserRow, "parent_phone">;

export function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    full_name: user.full_name,
    birth_date: user.birth_date,
    points: user.points,
    created_at: user.created_at,
  };
}

// Le nom complet sert d'identifiant de connexion : même forme à l'inscription et à la connexion.
export function normalizeName(name: string) {
  return name.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function isValidName(name: string) {
  return (
    name.length >= 2 &&
    name.length <= 80 &&
    /^[\p{L}\p{M}][\p{L}\p{M} '’-]*$/u.test(name)
  );
}

export function normalizePhone(phone: string) {
  const match = /^(?:\+213|00213|0)([567]\d{8})$/.exec(
    phone.replace(/[\s.-]/g, ""),
  );
  return match ? `+213${match[1]}` : null;
}

export function isValidBirthDate(birthDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;

  const date = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) {
    return false;
  }

  const now = new Date();
  return (
    birthDate <= now.toISOString().slice(0, 10) &&
    date.getUTCFullYear() >= now.getUTCFullYear() - 100
  );
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

  getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  getDb()
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashSessionToken(token), userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function getSessionProfile(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) return null;

  const user = getDb()
    .prepare(
      `SELECT users.id, users.full_name, users.birth_date, users.parent_phone,
              users.points, users.created_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashSessionToken(token), Date.now()) as UserProfile | undefined;

  return user ?? null;
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const profile = await getSessionProfile();
  return profile && toPublicUser(profile);
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    getDb()
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .run(hashSessionToken(token));
  }
  cookieStore.delete(sessionCookie);
}

export function createUserId() {
  return randomUUID();
}

export function findUserByName(fullName: string) {
  return getDb()
    .prepare(
      `SELECT id, full_name, birth_date, parent_phone, password_hash, points, created_at
       FROM users
       WHERE full_name = ?`,
    )
    .get(fullName) as UserRow | undefined;
}

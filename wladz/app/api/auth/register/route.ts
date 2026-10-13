import {
  createSession,
  createUserId,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(body.email);
  const password = body.password;
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    password.length > 128
  ) {
    return Response.json(
      { error: "Use a valid email and a password of 12-128 characters." },
      { status: 400 },
    );
  }

  const id = createUserId();
  const passwordHash = await hashPassword(password);
  const result = db
    .prepare(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING",
    )
    .run(id, email, passwordHash);

  if (result.changes === 0) {
    return Response.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  await createSession(id);
  return Response.json({ user: { id, email } }, { status: 201 });
}

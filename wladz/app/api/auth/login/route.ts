import {
  createSession,
  findUserByEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";

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
  const user = findUserByEmail(email);
  if (
    !user ||
    body.password.length > 128 ||
    !(await verifyPassword(body.password, user.password_hash))
  ) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return Response.json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
  });
}

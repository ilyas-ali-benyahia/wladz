import {
  createSession,
  findUserByName,
  normalizeName,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("fullName" in body) ||
    !("password" in body) ||
    typeof body.fullName !== "string" ||
    typeof body.password !== "string"
  ) {
    return Response.json({ error: "اكتب اسمك الكامل وكلمة السر." }, { status: 400 });
  }

  const fullName = normalizeName(body.fullName);
  const user = fullName.length <= 80 ? findUserByName(fullName) : undefined;
  if (
    !user ||
    body.password.length > 128 ||
    !(await verifyPassword(body.password, user.password_hash))
  ) {
    return Response.json(
      { error: "الاسم أو كلمة السر غير صحيحة. حاول مرة أخرى!" },
      { status: 401 },
    );
  }

  await createSession(user.id);
  return Response.json({ user: toPublicUser(user) });
}

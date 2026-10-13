import {
  createSession,
  createUserId,
  hashPassword,
  isValidBirthDate,
  isValidName,
  normalizeName,
  normalizePhone,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

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
    !("birthDate" in body) ||
    !("parentPhone" in body) ||
    !("password" in body) ||
    typeof body.fullName !== "string" ||
    typeof body.birthDate !== "string" ||
    typeof body.parentPhone !== "string" ||
    typeof body.password !== "string"
  ) {
    return Response.json({ error: "املأ كل الخانات من فضلك." }, { status: 400 });
  }

  const fullName = normalizeName(body.fullName);
  const birthDate = body.birthDate;
  const parentPhone = normalizePhone(body.parentPhone);
  const password = body.password;

  if (!isValidName(fullName)) {
    return Response.json(
      { error: "اكتب اسمك الكامل بالحروف فقط." },
      { status: 400 },
    );
  }
  if (!isValidBirthDate(birthDate)) {
    return Response.json({ error: "تاريخ الميلاد غير صحيح." }, { status: 400 });
  }
  if (!parentPhone) {
    return Response.json(
      { error: "اكتب رقم هاتف الوليّ هكذا: 0X XX XX XX XX" },
      { status: 400 },
    );
  }
  if (password.length < 12 || password.length > 128) {
    return Response.json(
      { error: "كلمة السر يجب أن تكون من 12 حرفاً على الأقل." },
      { status: 400 },
    );
  }

  const id = createUserId();
  const passwordHash = await hashPassword(password);
  const result = getDb()
    .prepare(
      `INSERT INTO users (id, full_name, birth_date, parent_phone, password_hash)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(full_name) DO NOTHING`,
    )
    .run(id, fullName, birthDate, parentPhone, passwordHash);

  if (result.changes === 0) {
    return Response.json(
      { error: "هذا الاسم مسجّل من قبل. سجّل دخولك أو أضف اسم أبيك إلى اسمك." },
      { status: 409 },
    );
  }

  await createSession(id);
  return Response.json(
    { user: { id, full_name: fullName, birth_date: birthDate, points: 0 } },
    { status: 201 },
  );
}

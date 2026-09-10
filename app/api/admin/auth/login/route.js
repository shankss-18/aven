import db from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "SELECT id, email, password_hash FROM admins WHERE email = ?",
    args: [email],
  });

  const admin = result.rows[0];

  if (!admin) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.password_hash);

  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({ adminId: admin.id, email: admin.email, role: "admin" });

  return Response.json({ token });
}
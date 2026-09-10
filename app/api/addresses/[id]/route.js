import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function PUT(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { fullName, phone, line1, city, state, pincode } = await req.json();

  if (!fullName || !phone || !line1 || !city || !state || !pincode) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  await db.execute({
    sql: "update addresses set full_name = ?, phone = ?, line1 = ?, city = ?, state = ?, pincode = ? where id = ? and user_id = ?",
    args: [fullName, phone, line1, city, state, pincode, id, user.userId]
  });

  return Response.json({ success: true, id: Number(id) });
}

export async function DELETE(req, { params }) {
  const user = getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db.execute({
    sql: "delete from addresses where id = ? and user_id = ?",
    args: [id, user.userId]
  });

  return Response.json({ success: true, id: Number(id) });
}

import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await db.execute({
    sql: `
      SELECT w.id, w.product_id, p.name, p.category, p.base_price, p.image_url
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.id DESC
    `,
    args: [user.userId],
  });
  return Response.json({items : result.rows})
}

export async function POST(req){
    const user = getUserFromRequest(req);
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {productId} = await req.json()
    if(!productId){
        return Response.json({error: "productId is required"}, {status: 400})
    }

    const existing = await db.execute({
        sql: 'select id from wishlist_items where user_id = ? and product_id = ?',
        args: [user.userId, productId]
    })

    if(existing.rows.length > 0){
        return Response.json({message: "already in the wishlist"}, {status: 200})
    }

    await db.execute({
        sql : 'insert into wishlist_items (user_id, product_id) values (?,?)',
        args: [user.userId, productId]
    })
    return Response.json({success : true}, {status: 201})
}
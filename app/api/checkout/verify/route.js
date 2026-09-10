import crypto from "crypto"
import db from "@/lib/db"
import { getUserFromRequest } from "@/lib/getUserFromRequest"

export async function POST(req){
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error:"Unauthorized"}, {status:401})
    }

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId} = await req.json()
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex")
    
    if(expectedSignature !== razorpay_signature){
        return Response.json({error:"Invalid signature"}, {status:400})
    }
    
    const cartResult = await db.execute({
    sql: `
      SELECT ci.id AS cart_item_id, ci.quantity, ci.variant_id,
             pv.price_override, p.base_price
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ci.user_id = ?
    `,
    args: [user.userId],
  });

  const totalAmount = cartResult.rows.reduce((sum, item) => {
    const unitPrice = item.price_override ?? item.base_price
    return sum + unitPrice * item.quantity
  }, 0) 

  const orderResult = await db.execute({
    sql: `INSERT INTO orders (user_id, address_id, status, total_amount, razorpay_order_id, razorpay_payment_id)
      VALUES (?, ?, 'paid', ?, ?, ?)`,
    args: [user.userId, addressId, totalAmount, razorpay_order_id, razorpay_payment_id]
  })

  const orderId = Number(orderResult.lastInsertRowid)

  for(const item of cartResult.rows){
    const unitPrice = item.price_override ?? item.base_price

   await db.execute({
      sql: `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase)
            VALUES (?, ?, ?, ?)`,
      args: [orderId, item.variant_id, item.quantity, unitPrice],
    });

    await db.execute({
      sql: `UPDATE product_variants SET stock = stock - ? WHERE id = ?`,
      args: [item.quantity, item.variant_id],
        });
    }

    await db.execute({
        sql: "DELETE FROM cart_items WHERE user_id = ?",
        args: [user.userId],
    })
    
    return Response.json({orderId, status: "paid"}, {status: 201})
}
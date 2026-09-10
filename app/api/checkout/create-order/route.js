import db from "@/lib/db";
import razorpay from "@/lib/razorpay";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(req) {
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error:"Unauthorized"}, {status:401})
    }

    const {addressId} = await req.json()
    if(!addressId){
        return Response.json({error:"Missing required fields"}, {status:400})
    }

    const cartResult = await db.execute({
        sql: `
      SELECT ci.quantity, ci.variant_id, pv.stock, pv.price_override, p.base_price
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ci.user_id = ?
    `,
    args: [user.userId],
    })
    
    if(cartResult.rows.length == 0){
        return Response.json({error : "Cart is empty"}, {status: 400})
    }

    for(const item of cartResult.rows){
        if(item.stock < item.quantity){
            return Response.json({error : "One or more items are out of stock"}, {status: 400})
        }
    }

    const totalAmount = cartResult.rows.reduce((sum, item) => {
        const unitPrice = item.price_override ?? item.base_price
        return sum + unitPrice * item.quantity
    }, 0)

    const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount,
        currency: "INR",
        receipt: `receipt_${user.userID}_${Date.now()}`
    })

    return Response.json({
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        keyId: process.env.RAZORPAY_KEY_ID,
        addressId
    })

}
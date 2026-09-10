import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function DELETE(req, {params}){
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error : "Unauthorized access"}, {status: 401})
    }

    const {productId} = await params
    if(!productId){
        return Response.json({error : "product Id is required"}, {status: 400})
    }

    await db.execute({
        sql : 'delete from wishlist_items where user_id = ? and product_id = ?',
        args: [user.userId, productId]
    })
    return Response.json({success: true}, {status: 200})
}
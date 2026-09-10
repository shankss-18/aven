import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function PUT(request, {params}){
    const user = getUserFromRequest(request)
    if(!user){
        return Response.json({error : "Unauthorized"}, {status : 401})
    }
    const { itemId } =await params
    const { quantity } = await request.json()
    if(!quantity || quantity < 1){
        return Response.json({error : "Invalid Quantity"}, {status: 400})
    }

    await db.execute({
        sql : 'update cart_items set quantity = ? where id = ? and user_id = ?',
        args: [quantity, itemId, user.userId]
    })
    return Response.json({success: true})
}

export async function DELETE(request, {params}){
    const user = getUserFromRequest(request)
    if(!user){
        return Response.json({error : "Unauthorized"}, {status : 401})
    }
    const {itemId} = await params

    await db.execute({
        sql: 'delete from cart_items where id = ? and user_id = ?',
        args: [itemId, user.userId]
    })
    return Response.json({success: true})
}
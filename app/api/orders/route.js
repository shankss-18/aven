import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req) {
    const user = getUserFromRequest(req)
    if (!user) {
        return new Response("Unauthorized", { status: 401 })
    }

    const result = await db.execute({
        sql: `
        select id, status, total_amount, shiprocket_awb, created_at, cancellation_status, cancellation_reason
        from orders where user_id = ? 
        order by created_at desc;
        `,
        args: [user.userId ?? user.id]
    })

    return Response.json({ orders: result.rows })
}
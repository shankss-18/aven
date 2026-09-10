import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req){
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error: "unauthenticated"}, {status: 401})
    }
    const result = await db.execute({
        sql: "SELECT id, name, email, created_at FROM users WHERE id = ?",
        args: [user.userId],
    })
    const account = result.rows[0]
    if(!account){
        return Response.json({error: "User not found"}, {status: 404})
    }
    return Response.json({ account, ...account })
}
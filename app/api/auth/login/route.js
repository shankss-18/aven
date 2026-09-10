import db from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth";

export async function POST(req) {
    const {email, password} = await req.json()
    if(!email || !password){
        return Response.json({error:"All required fields"}, {status: 400})
    }
    const result = await db.execute({
        sql: "select name, id, email, password_hash from users where email = ?",
        args: [email]
    })

    const user = result.rows[0]

    if(!user){
        return Response.json({ error: "Invalid credentials" }, { status: 401 }) 
    }

    const valid = await verifyPassword(password, user.password_hash)
    if(!valid){
        return Response.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const token = signToken({userId: user.id, email: email})
    return Response.json({ token })
}
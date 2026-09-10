import db from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req){
    const {name, email, password} = await req.json()
    
    if(!name || !email || !password){
        return Response.json({error: "All fields are required"}, {status: 400})
    }
    const existing = await db.execute({
        sql: 'select id from users where email = ?',
        args: [email]
    })
    if(existing.rows.length > 0){
        return Response.json({error: "Email already exists"}, {status: 409})
    }

    const hashedPassword = await hashPassword(password)

    const result = await db.execute({
        sql: 'insert into users (name, email, password_hash) values (?, ?, ?)',
        args : [name, email, hashedPassword]
    })

    const token = signToken({userId : Number((result).lastInsertRowid), email})

    return Response.json({token}, {status: 201})
}
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req){
    const user = await getUserFromRequest(req)
    if(!user){
        return Response.json({error:"Unauthorized"},{status:401})
    }
    
    const result = await db.execute({
        sql : 'select * from addresses where user_id = ?',
        args: [user.userId]
    })

    return Response.json({addresses : result.rows})

}

export async function POST(req){
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error:"Unauthorized"}, {status:401})
    }

    const {fullName, phone, line1, city, state, pincode } = await req.json()

    if(!fullName || !phone || !line1 || !city || !state || !pincode ){
        return Response.json({error:"Missing required fields"}, {status:400})
    }

    const result = await db.execute({
        sql : "insert into addresses (user_id, full_name, phone, line1, city, state, pincode) values(?, ?, ?, ?, ?, ?, ?)",
        args: [user.userId, fullName, phone, line1, city, state, pincode]
    })

    return Response.json({id: Number(result.lastInsertRowid)},{status: 201})

}

export async function PUT(req) {
    const user = getUserFromRequest(req);
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, fullName, phone, line1, city, state, pincode } = await req.json();

    if (!id || !fullName || !phone || !line1 || !city || !state || !pincode) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.execute({
        sql: "update addresses set full_name = ?, phone = ?, line1 = ?, city = ?, state = ?, pincode = ? where id = ? and user_id = ?",
        args: [fullName, phone, line1, city, state, pincode, id, user.userId]
    });

    return Response.json({ success: true, id: Number(id) });
}

export async function DELETE(req) {
    const user = getUserFromRequest(req);
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let id;
    const url = new URL(req.url);
    const queryId = url.searchParams.get("id");
    if (queryId) {
        id = queryId;
    } else {
        try {
            const body = await req.json();
            id = body?.id;
        } catch {
            // ignore
        }
    }

    if (!id) {
        return Response.json({ error: "Address ID required" }, { status: 400 });
    }

    await db.execute({
        sql: "delete from addresses where id = ? and user_id = ?",
        args: [id, user.userId]
    });

    return Response.json({ success: true, id: Number(id) });
}
import db from '@/lib/db'

export async function GET() {
    const result = await db.execute("select name from sqlite_master where type='table'")
    return Response.json(result.rows)
}
import db from "@/lib/db";

export async function GET(req, { params }) {
    const { id } = await params
    const productResult = await db.execute({
        sql: "select id, name , description, category, image_url, base_price from products where id = ? and (is_active = 1 or is_active is null)",
        args: [id]
    })
    const product = productResult.rows[0]

    if(!product){
        return Response.json({error: "product not found"}, {status: 404})
    }

    const variantsResult = await db.execute({
        sql: 'select id, size, color, color_hex, stock, price_override from product_variants where product_id = ?',
        args: [id]
    })

    const imagesResult = await db.execute({
        sql: 'select id, coalesce(image_url, url) as image_url, sort_order from product_images where product_id = ? order by sort_order asc',
        args: [id]
    })

    return Response.json({
        product,
        variants: variantsResult.rows,
        images: imagesResult.rows,
    })
}
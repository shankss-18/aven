import { getAdminFromRequest } from "./getAdminFromRequest";

export function withAdminAuth(handler) {
    return async (request, context) => {
        const admin = getAdminFromRequest(request)
        if (!admin) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }
        return handler(request, context, admin)
    }
}
import { FUNCTIONS_CONFIG_MANIFEST } from "next/dist/shared/lib/constants";
import { verifyToken } from "./auth";
import { decode } from "jsonwebtoken";

export function getAdminFromRequest(req){
    const authHeader = req.headers.get("authorization")
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return null
    }
    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if(!decoded || decoded.role !== "admin"){
        return null
    }
    return decoded
}
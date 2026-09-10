import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

export async function hashPassword(password) {
    return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
}

export function signToken(paylaod){
    return jwt.sign(paylaod, process.env.JWT_SECRET, {expiresIn: "7d"})
}

export function verifyToken(token){
    try{
        return jwt.verify(token, process.env.JWT_SECRET)
    }catch{
        return null
    }
}
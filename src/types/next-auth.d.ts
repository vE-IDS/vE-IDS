import { User } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"
import { AdapterUser } from "next-auth/adapters"

declare module "next-auth" {
    interface Session {
        user: User
    }
}
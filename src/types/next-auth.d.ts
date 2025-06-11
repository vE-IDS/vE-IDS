import { User } from "@prisma/client"
import NextAuth, { DefaultSession } from "next-auth"
import { AdapterUser } from "next-auth/adapters"

declare module "next-auth" {
    interface SessionUser extends AdapterUser extends User {}

    interface Session {
        user: SessionUser
    }
}
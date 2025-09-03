import prisma from "@/lib/db"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions, User } from "next-auth"
import { vatsimProvider } from "./vatsimProvider"

export const authOptions: NextAuthOptions = {
    providers: [
        vatsimProvider
    ],
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'database'
    },
    callbacks: {
        session: async({session, user}) => {
            session.user = {
                id: user.id,
                cid: (user as any).cid,
                firstName: (user as any).firstName,
                lastName: (user as any).lastName,
                email: user.email,
                emailVerified: user.emailVerified,
                rating: (user as any).rating
            }
            return session
        }
    }
}
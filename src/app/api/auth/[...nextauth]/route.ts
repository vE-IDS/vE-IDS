import { vatsimProvider } from '@/next-auth/vatsimProvider'
import NextAuth, { AuthOptions, Session } from 'next-auth'
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"

export const authOptions: AuthOptions = {
    providers: [
        vatsimProvider
    ],
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'database'
    },
    callbacks: {
        session: async({session, user}) => {
            session.user = user
            return session
        }
    }
}

const route = NextAuth(authOptions)
export {route as GET, route as POST}
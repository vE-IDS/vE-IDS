import NextAuth, { NextAuthOptions, Session } from 'next-auth'
import { authOptions } from '@/next-auth/authOptions'

const route = NextAuth(authOptions)
export {route as GET, route as POST}
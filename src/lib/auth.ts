import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch additional user preferences
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            defaultCurrency: true,
            notifyEnabled: true,
            notifyDay: true,
            deletedAt: true,
          },
        })
        if (dbUser) {
          session.user.defaultCurrency = dbUser.defaultCurrency
          session.user.notifyEnabled = dbUser.notifyEnabled
          session.user.notifyDay = dbUser.notifyDay
          // Clear deletedAt if user logs in during grace period
          if (dbUser.deletedAt) {
            await prisma.user.update({
              where: { id: user.id },
              data: { deletedAt: null },
            })
          }
        }
      }
      return session
    },
    async signIn({ user }) {
      // Check if user is in deletion grace period
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { deletedAt: true },
        })
        if (dbUser?.deletedAt) {
          // Restore user during grace period
          await prisma.user.update({
            where: { id: user.id },
            data: { deletedAt: null },
          })
        }
      }
      return true
    },
  },
  session: {
    strategy: 'database',
  },
})

// Extend session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      defaultCurrency: string
      notifyEnabled: boolean
      notifyDay: number
    }
  }
}

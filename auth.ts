import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Role } from "@/generated/prisma/client";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified" as const;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
  interface User {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate-limit login attempts per email address (10 per 15 minutes)
        const rl = checkRateLimit(
          `login:${(credentials.email as string).toLowerCase()}`,
          10,
          15 * 60 * 1000,
        );
        if (!rl.allowed) {
          throw new CredentialsSignin(
            `Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`,
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        // Account exists but email not verified yet
        if (!user.active && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        if (!user.active) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});

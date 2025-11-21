import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/src/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials.email;
        const password = credentials.password;

        if (!email || !password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.users.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // compare passwords
        const isMatch = compare(password, user.password_hash);

        if (!isMatch) {
          throw new Error("Invalid password");
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id.toString();
        token.name = user.username;
      }

      if (trigger === "update" && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.email) token.email = session.user.email;
      }

      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
});

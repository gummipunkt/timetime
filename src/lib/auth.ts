import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: Role;
      departmentId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    departmentId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    departmentId?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-Mail und Passwort sind erforderlich");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            firstName: true,
            lastName: true,
            role: true,
            departmentId: true,
            isActive: true,
          },
        });

        if (!user) {
          throw new Error("Ungültige Anmeldedaten");
        }

        if (!user.isActive) {
          throw new Error("Ihr Konto wurde deaktiviert");
        }

        const isValidPassword = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Ungültige Anmeldedaten");
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        role: token.role,
        departmentId: token.departmentId,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 Stunden
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Prüft ob der User die erforderliche Rolle hat
 */
export function hasRole(userRole: Role, requiredRole: Role | Role[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  // Admin hat immer Zugriff
  if (userRole === Role.ADMIN) return true;
  
  return roles.includes(userRole);
}

/**
 * Prüft ob der User Admin ist
 */
export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}

/**
 * Prüft ob der User Supervisor oder Admin ist
 */
export function isSupervisorOrAdmin(role: Role): boolean {
  return role === Role.ADMIN || role === Role.SUPERVISOR;
}

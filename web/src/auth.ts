import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [Google],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      const googleProfile = profile as
        | {
            email?: string;
            email_verified?: boolean;
          }
        | undefined;

      return Boolean(
        googleProfile?.email &&
          googleProfile.email_verified
      );
    },

    async session({ session, token }) {
      if (
        session.user &&
        typeof token.sub === "string"
      ) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
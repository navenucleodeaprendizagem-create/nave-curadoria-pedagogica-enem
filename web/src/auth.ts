import NextAuth, {
  type DefaultSession,
} from "next-auth";

import Google from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

type NaveJwtToken = {
  sub?: string;
  googleId?: string;
};

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google,
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({
      account,
      profile,
    }) {
      if (
        account?.provider !==
        "google"
      ) {
        return false;
      }

      const googleProfile =
        profile as
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

    /*
     * V0.11.7.4a
     *
     * Guardamos explicitamente no JWT o identificador
     * da conta Google fornecido pelo provider.
     *
     * Não usamos module augmentation de "next-auth/jwt"
     * porque esta instalação do next-auth não expõe esse
     * caminho de módulo para o TypeScript do projeto.
     */
    async jwt({
      token,
      account,
    }) {
      const naveToken =
        token as typeof token &
          NaveJwtToken;

      if (
        account?.provider ===
          "google" &&
        typeof
          account.providerAccountId ===
          "string" &&
        account.providerAccountId.trim()
      ) {
        naveToken.googleId =
          account.providerAccountId.trim();
      }

      return naveToken;
    },

    /*
     * Expõe na sessão somente o identificador Google
     * persistido no JWT.
     */
    async session({
      session,
      token,
    }) {
      const naveToken =
        token as typeof token &
          NaveJwtToken;

      if (
        session.user &&
        typeof
          naveToken.googleId ===
          "string" &&
        naveToken.googleId.trim()
      ) {
        session.user.id =
          naveToken.googleId.trim();
      }

      return session;
    },
  },
});
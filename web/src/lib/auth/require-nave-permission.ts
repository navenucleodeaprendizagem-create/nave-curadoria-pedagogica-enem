import { redirect } from "next/navigation";

import {
  getNaveUserContext,
  type NavePermissions,
  type NaveUser,
  type NaveUserContext,
} from "@/lib/auth/nave-user";

export type NavePermissionKey =
  keyof NavePermissions;

export type AuthorizedNaveContext = {
  user: NaveUser;
  permissions: NavePermissions;
};

export async function requireNavePermission(
  permission: NavePermissionKey
): Promise<AuthorizedNaveContext> {
  const context: NaveUserContext =
    await getNaveUserContext();

  if (
    context.reason ===
    "NOT_AUTHENTICATED"
  ) {
    redirect("/");
  }

  /*
   * V0.11.7.1
   *
   * Falha técnica NÃO é falta de autorização.
   * Voltamos ao início, onde o NaveAccessGate fará
   * nova tentativa e mostrará mensagem técnica se
   * o backend continuar indisponível.
   */
  if (context.ok !== true) {
    redirect(
      "/?naveAuth=verification-failed"
    );
  }

  /*
   * Só chegamos a "motivo=usuario" quando o
   * backend respondeu corretamente e confirmou
   * que a conta não está autorizada.
   */
  if (
    context.authorized !== true ||
    !context.user ||
    !context.permissions
  ) {
    redirect(
      "/acesso-negado?motivo=usuario"
    );
  }

  if (
    context.permissions[permission] !==
    true
  ) {
    redirect(
      `/acesso-negado?motivo=permissao&recurso=${permission}`
    );
  }

  return {
    user: context.user,
    permissions:
      context.permissions,
  };
}
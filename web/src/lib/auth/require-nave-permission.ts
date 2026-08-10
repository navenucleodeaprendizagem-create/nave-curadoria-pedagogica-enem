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
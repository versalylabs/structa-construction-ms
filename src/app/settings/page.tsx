import React from "react";
import { AuthenticatedLayout } from "@/components/shell/AuthenticatedLayout";
import { getSessionContext } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <AuthenticatedLayout>
        <div />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <SettingsClient
        organization={ctx.organization}
        canManageSettings={ctx.can("settings:manage")}
      />
    </AuthenticatedLayout>
  );
}

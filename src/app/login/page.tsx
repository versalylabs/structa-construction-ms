import React from "react";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureSeedData } from "../../../prisma/seed";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  await ensureSeedData();
  const ctx = await getSessionContext();

  if (ctx) {
    redirect("/");
  }

  const demoUsers = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          code: true,
          ncaRegistration: true,
          city: true,
        },
      },
    },
    orderBy: [{ organization: { name: "desc" } }, { createdAt: "asc" }],
  });

  return <LoginClient demoUsers={demoUsers} />;
}

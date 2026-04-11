import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as Role;
  if (role === "PATIENT") {
    redirect("/portal");
  }

  redirect("/dashboard");
}

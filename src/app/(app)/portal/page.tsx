import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PatientPortalClient } from "./PatientPortalClient";

export default async function PortalPage() {
  const session = await auth();
  if (session!.user.role !== "PATIENT") redirect("/dashboard");

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
  });

  if (!patient) {
    return (
      <div className="text-center py-20 text-gray-500 text-sm">
        Perfil de paciente não encontrado. Entre em contato com a recepção.
      </div>
    );
  }

  return (
    <PatientPortalClient patientId={patient.id} patientName={session!.user.name ?? "Paciente"} />
  );
}

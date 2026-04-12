import { PrismaClient, Role, AppointmentStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.dentist.deleteMany();

  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Admin
  await prisma.user.create({
    data: {
      email: "admin@clinica.com",
      password: hashedPassword,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  // Dentists
  const dentistUser1 = await prisma.user.create({
    data: {
      email: "dr.silva@clinica.com",
      password: hashedPassword,
      name: "Dr. Ana Silva",
      role: Role.DENTIST,
      dentist: {
        create: {
          specialty: "Clínica Geral",
          workingHours: [
            { day: "MONDAY", start: "08:00", end: "18:00" },
            { day: "TUESDAY", start: "08:00", end: "18:00" },
            { day: "WEDNESDAY", start: "08:00", end: "18:00" },
            { day: "THURSDAY", start: "08:00", end: "18:00" },
            { day: "FRIDAY", start: "08:00", end: "17:00" },
          ],
        },
      },
    },
    include: { dentist: true },
  });

  const dentistUser2 = await prisma.user.create({
    data: {
      email: "dr.costa@clinica.com",
      password: hashedPassword,
      name: "Dr. Bruno Costa",
      role: Role.DENTIST,
      dentist: {
        create: {
          specialty: "Ortodontia",
          workingHours: [
            { day: "MONDAY", start: "09:00", end: "17:00" },
            { day: "WEDNESDAY", start: "09:00", end: "17:00" },
            { day: "FRIDAY", start: "09:00", end: "16:00" },
          ],
        },
      },
    },
    include: { dentist: true },
  });

  // Receptionist
  await prisma.user.create({
    data: {
      email: "recepcao@clinica.com",
      password: hashedPassword,
      name: "Maria Santos",
      role: Role.RECEPTIONIST,
    },
  });

  // Patients
  const patientUser1 = await prisma.user.create({
    data: {
      email: "joao.lima@email.com",
      password: hashedPassword,
      name: "João Lima",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990001",
          dateOfBirth: new Date("1990-05-15"),
          medicalNotes: "Alérgico a penicilina.",
        },
      },
    },
    include: { patient: true },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: "camila.ferreira@email.com",
      password: hashedPassword,
      name: "Camila Ferreira",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990002",
          dateOfBirth: new Date("1985-11-22"),
        },
      },
    },
    include: { patient: true },
  });

  const patientUser3 = await prisma.user.create({
    data: {
      email: "rafael.mendes@email.com",
      password: hashedPassword,
      name: "Rafael Mendes",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990003",
          dateOfBirth: new Date("2000-03-08"),
        },
      },
    },
    include: { patient: true },
  });

  const patientUser4 = await prisma.user.create({
    data: {
      email: "lucas.oliveira@email.com",
      password: hashedPassword,
      name: "Lucas Oliveira",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990004",
          dateOfBirth: new Date("1995-07-20"),
          medicalNotes: "Ansiedade em procedimentos. Solicitar sedação se necessário.",
        },
      },
    },
    include: { patient: true },
  });

  const patientUser5 = await prisma.user.create({
    data: {
      email: "fernanda.santos@email.com",
      password: hashedPassword,
      name: "Fernanda Santos",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990005",
          dateOfBirth: new Date("1992-02-14"),
        },
      },
    },
    include: { patient: true },
  });

  const patientUser6 = await prisma.user.create({
    data: {
      email: "carlos.pereira@email.com",
      password: hashedPassword,
      name: "Carlos Pereira",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990006",
          dateOfBirth: new Date("1978-09-03"),
          medicalNotes: "Diabetes tipo 2. Verificar glicemia antes de procedimentos.",
        },
      },
    },
    include: { patient: true },
  });

  const patientUser7 = await prisma.user.create({
    data: {
      email: "julia.ramos@email.com",
      password: hashedPassword,
      name: "Julia Ramos",
      role: Role.PATIENT,
      patient: {
        create: {
          phone: "+5511999990007",
          dateOfBirth: new Date("2003-12-01"),
        },
      },
    },
    include: { patient: true },
  });

  const dentist1 = dentistUser1.dentist!;
  const dentist2 = dentistUser2.dentist!;
  const patient1 = patientUser1.patient!;
  const patient2 = patientUser2.patient!;
  const patient3 = patientUser3.patient!;
  const patient4 = patientUser4.patient!;
  const patient5 = patientUser5.patient!;
  const patient6 = patientUser6.patient!;
  const patient7 = patientUser7.patient!;

  const today     = new Date();
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const day2      = new Date(today); day2.setDate(today.getDate() + 2);
  const day3      = new Date(today); day3.setDate(today.getDate() + 3);
  const day4      = new Date(today); day4.setDate(today.getDate() + 4);
  const nextWeek  = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const day2ago   = new Date(today); day2ago.setDate(today.getDate() - 2);
  const lastWeek  = new Date(today); lastWeek.setDate(today.getDate() - 7);

  function t(hhmm: string) {
    return new Date(`1970-01-01T${hhmm}:00`);
  }

  await prisma.appointment.createMany({
    data: [
      // ── Today ──────────────────────────────────────────────────────────────
      { patientId: patient1.id, dentistId: dentist1.id, date: today, startTime: t("08:00"), endTime: t("09:00"), status: AppointmentStatus.COMPLETED, notes: "Limpeza dental." },
      { patientId: patient3.id, dentistId: dentist2.id, date: today, startTime: t("10:00"), endTime: t("11:00"), status: AppointmentStatus.IN_PROGRESS },
      { patientId: patient4.id, dentistId: dentist1.id, date: today, startTime: t("11:00"), endTime: t("12:00"), status: AppointmentStatus.SCHEDULED },
      { patientId: patient2.id, dentistId: dentist2.id, date: today, startTime: t("14:00"), endTime: t("15:00"), status: AppointmentStatus.SCHEDULED, notes: "Ajuste de aparelho." },
      { patientId: patient5.id, dentistId: dentist1.id, date: today, startTime: t("15:30"), endTime: t("16:30"), status: AppointmentStatus.SCHEDULED },
      { patientId: patient7.id, dentistId: dentist2.id, date: today, startTime: t("16:00"), endTime: t("17:00"), status: AppointmentStatus.REQUESTED },

      // ── Tomorrow ───────────────────────────────────────────────────────────
      { patientId: patient1.id, dentistId: dentist1.id, date: tomorrow, startTime: t("09:00"), endTime: t("10:00"), status: AppointmentStatus.SCHEDULED, notes: "Consulta de rotina." },
      { patientId: patient2.id, dentistId: dentist1.id, date: tomorrow, startTime: t("11:00"), endTime: t("12:00"), status: AppointmentStatus.REQUESTED },
      { patientId: patient4.id, dentistId: dentist2.id, date: tomorrow, startTime: t("09:00"), endTime: t("10:00"), status: AppointmentStatus.SCHEDULED, notes: "Colocação de braces." },
      { patientId: patient5.id, dentistId: dentist1.id, date: tomorrow, startTime: t("14:00"), endTime: t("15:00"), status: AppointmentStatus.REQUESTED },
      { patientId: patient6.id, dentistId: dentist1.id, date: tomorrow, startTime: t("15:30"), endTime: t("16:30"), status: AppointmentStatus.SCHEDULED },
      { patientId: patient7.id, dentistId: dentist2.id, date: tomorrow, startTime: t("10:30"), endTime: t("11:30"), status: AppointmentStatus.SCHEDULED },

      // ── Day +2 ─────────────────────────────────────────────────────────────
      { patientId: patient3.id, dentistId: dentist1.id, date: day2, startTime: t("09:00"), endTime: t("10:00"), status: AppointmentStatus.SCHEDULED, notes: "Revisão geral." },
      { patientId: patient1.id, dentistId: dentist2.id, date: day2, startTime: t("11:00"), endTime: t("12:00"), status: AppointmentStatus.REQUESTED },
      { patientId: patient4.id, dentistId: dentist1.id, date: day2, startTime: t("13:30"), endTime: t("14:30"), status: AppointmentStatus.SCHEDULED },
      { patientId: patient6.id, dentistId: dentist2.id, date: day2, startTime: t("15:00"), endTime: t("16:00"), status: AppointmentStatus.SCHEDULED, notes: "Consulta implante." },

      // ── Day +3 ─────────────────────────────────────────────────────────────
      { patientId: patient2.id, dentistId: dentist2.id, date: day3, startTime: t("10:00"), endTime: t("11:00"), status: AppointmentStatus.SCHEDULED },
      { patientId: patient5.id, dentistId: dentist1.id, date: day3, startTime: t("14:00"), endTime: t("15:00"), status: AppointmentStatus.REQUESTED },
      { patientId: patient7.id, dentistId: dentist1.id, date: day3, startTime: t("16:00"), endTime: t("17:00"), status: AppointmentStatus.SCHEDULED },

      // ── Day +4 ─────────────────────────────────────────────────────────────
      { patientId: patient3.id, dentistId: dentist2.id, date: day4, startTime: t("08:00"), endTime: t("09:00"), status: AppointmentStatus.REQUESTED },
      { patientId: patient6.id, dentistId: dentist1.id, date: day4, startTime: t("10:00"), endTime: t("11:00"), status: AppointmentStatus.SCHEDULED },

      // ── Yesterday ──────────────────────────────────────────────────────────
      { patientId: patient2.id, dentistId: dentist1.id, date: yesterday, startTime: t("09:00"), endTime: t("10:00"), status: AppointmentStatus.COMPLETED },
      { patientId: patient4.id, dentistId: dentist1.id, date: yesterday, startTime: t("10:00"), endTime: t("11:00"), status: AppointmentStatus.COMPLETED, notes: "Extração do siso." },
      { patientId: patient5.id, dentistId: dentist2.id, date: yesterday, startTime: t("14:00"), endTime: t("15:00"), status: AppointmentStatus.COMPLETED },
      { patientId: patient6.id, dentistId: dentist1.id, date: yesterday, startTime: t("16:00"), endTime: t("17:00"), status: AppointmentStatus.CANCELLED, notes: "Paciente cancelou." },

      // ── 2 days ago ─────────────────────────────────────────────────────────
      { patientId: patient7.id, dentistId: dentist2.id, date: day2ago, startTime: t("09:30"), endTime: t("10:30"), status: AppointmentStatus.COMPLETED },
      { patientId: patient1.id, dentistId: dentist1.id, date: day2ago, startTime: t("11:00"), endTime: t("12:00"), status: AppointmentStatus.COMPLETED },

      // ── Next week ──────────────────────────────────────────────────────────
      { patientId: patient1.id, dentistId: dentist2.id, date: nextWeek, startTime: t("14:00"), endTime: t("15:00"), status: AppointmentStatus.SCHEDULED, notes: "Ajuste de aparelho." },
      { patientId: patient3.id, dentistId: dentist1.id, date: nextWeek, startTime: t("09:00"), endTime: t("10:00"), status: AppointmentStatus.SCHEDULED },
      { patientId: patient5.id, dentistId: dentist2.id, date: nextWeek, startTime: t("11:00"), endTime: t("12:00"), status: AppointmentStatus.SCHEDULED, notes: "Consulta de retorno." },

      // ── Last week ──────────────────────────────────────────────────────────
      { patientId: patient3.id, dentistId: dentist1.id, date: lastWeek, startTime: t("15:00"), endTime: t("16:00"), status: AppointmentStatus.CANCELLED, notes: "Paciente desmarcou." },
      { patientId: patient2.id, dentistId: dentist2.id, date: lastWeek, startTime: t("10:00"), endTime: t("11:00"), status: AppointmentStatus.COMPLETED },
    ],
  });

  console.log("Seed complete!");
  console.log("Accounts:");
  console.log("  Admin:        admin@clinica.com / password123");
  console.log("  Dentist 1:    dr.silva@clinica.com / password123");
  console.log("  Dentist 2:    dr.costa@clinica.com / password123");
  console.log("  Receptionist: recepcao@clinica.com / password123");
  console.log("  Patient 1:    joao.lima@email.com / password123");
  console.log("  Patient 2:    camila.ferreira@email.com / password123");
  console.log("  Patient 3:    rafael.mendes@email.com / password123");
  console.log("  Patient 4:    lucas.oliveira@email.com / password123");
  console.log("  Patient 5:    fernanda.santos@email.com / password123");
  console.log("  Patient 6:    carlos.pereira@email.com / password123");
  console.log("  Patient 7:    julia.ramos@email.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

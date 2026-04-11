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
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
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

  const dentist1 = dentistUser1.dentist!;
  const dentist2 = dentistUser2.dentist!;
  const patient1 = patientUser1.patient!;
  const patient2 = patientUser2.patient!;
  const patient3 = patientUser3.patient!;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Appointments
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient1.id,
        dentistId: dentist1.id,
        date: tomorrow,
        startTime: new Date(`1970-01-01T09:00:00`),
        endTime: new Date(`1970-01-01T10:00:00`),
        status: AppointmentStatus.SCHEDULED,
        notes: "Consulta de rotina.",
      },
      {
        patientId: patient2.id,
        dentistId: dentist1.id,
        date: tomorrow,
        startTime: new Date(`1970-01-01T11:00:00`),
        endTime: new Date(`1970-01-01T12:00:00`),
        status: AppointmentStatus.REQUESTED,
      },
      {
        patientId: patient3.id,
        dentistId: dentist2.id,
        date: today,
        startTime: new Date(`1970-01-01T10:00:00`),
        endTime: new Date(`1970-01-01T11:00:00`),
        status: AppointmentStatus.IN_PROGRESS,
      },
      {
        patientId: patient1.id,
        dentistId: dentist2.id,
        date: nextWeek,
        startTime: new Date(`1970-01-01T14:00:00`),
        endTime: new Date(`1970-01-01T15:00:00`),
        status: AppointmentStatus.SCHEDULED,
        notes: "Ajuste de aparelho.",
      },
      {
        patientId: patient2.id,
        dentistId: dentist1.id,
        date: yesterday,
        startTime: new Date(`1970-01-01T09:00:00`),
        endTime: new Date(`1970-01-01T10:00:00`),
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patient3.id,
        dentistId: dentist1.id,
        date: lastWeek,
        startTime: new Date(`1970-01-01T15:00:00`),
        endTime: new Date(`1970-01-01T16:00:00`),
        status: AppointmentStatus.CANCELLED,
        notes: "Paciente desmarcou.",
      },
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

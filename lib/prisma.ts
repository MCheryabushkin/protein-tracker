import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrisma() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/protein_tracker"
  if (!/^postgres(ql)?:\/\//.test(connectionString)) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL URL (postgresql://...)"
    )
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
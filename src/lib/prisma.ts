import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
	return new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'error', emit: 'event' },
			{ level: 'warn', emit: 'event' },
			{ level: 'info', emit: 'event' }
		]
	});
};

const globalForPrisma = global as unknown as { prisma: ReturnType<typeof prismaClientSingleton> };

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

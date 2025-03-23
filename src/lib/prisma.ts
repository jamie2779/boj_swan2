import { PrismaClient } from '@prisma/client';
import { container } from '@sapphire/framework';

export const prisma = new PrismaClient();

// 필요하다면 즉시 데이터베이스에 연결해 연결 문제를 사전에 확인할 수 있습니다.
// await prisma.$connect();

// Sapphire의 container에 PrismaClient를 첨부하여 어디서든 접근할 수 있도록 함
container.prisma = prisma;

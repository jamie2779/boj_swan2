import { PrismaClient } from '@prisma/client';
import { container } from '@sapphire/framework';

export const prisma = new PrismaClient({
	log: [
		{ level: 'query', emit: 'event' },
		{ level: 'error', emit: 'event' },
		{ level: 'warn', emit: 'event' },
		{ level: 'info', emit: 'event' }
	]
});

//쿼리 로그 (요약)
prisma.$on('query', (e) => {
	const operation = e.query.split(' ')[0];
	const table = e.query.match(/from\s+`?(\w+)`?/i)?.[1] || '';
	console.log(`🟦 [${operation}] ${table}(${e.duration}ms)`);
});

//에러 로그
prisma.$on('error', (e) => {
	console.error('🟥 [PRISMA ERROR]');
	console.error(`🔹 ${e.message}`);
});

//경고 로그
prisma.$on('warn', (e) => {
	console.warn('🟨 [PRISMA WARN]');
	console.warn(`🔸 ${e.message}`);
});

//정보 로그
prisma.$on('info', (e) => {
	console.info('ℹ️ [PRISMA INFO]');
	console.info(`🔹 ${e.message}`);
});

container.prisma = prisma;

import { PrismaClient } from '@prisma/client';
import '@sapphire/pieces';

declare module '@sapphire/pieces' {
	interface Container {
		prisma: PrismaClient;
		adminIds: string[];
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		guestOnly: never;
		userOnly: never;
		adminOnly: never;
	}
}

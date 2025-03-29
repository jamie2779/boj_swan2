import { PrismaClient } from '@prisma/client';
import { Guild, Role } from 'discord.js';
import '@sapphire/pieces';

declare module '@sapphire/pieces' {
	interface Container {
		prisma: PrismaClient;
		adminIds: string[];
		guild: Guild;
		roles: Role[];
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		guestOnly: never;
		userOnly: never;
		adminOnly: never;
	}
}

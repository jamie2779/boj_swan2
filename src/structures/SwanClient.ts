import { container, SapphireClient } from '@sapphire/framework';
import { type ClientOptions } from 'discord.js';
import prisma from '@/lib/prisma';

export class SwanClient extends SapphireClient {
	public constructor(options: ClientOptions) {
		super({
			...options
		});
	}

	public override async login(token?: string) {
		container.prisma = prisma;
		await container.prisma.$connect();
		container.logger.info('Prisma Client Connected');

		return super.login(token);
	}

	public override async destroy() {
		await container.prisma.$disconnect();
		return super.destroy();
	}
}

import './lib/setup';
import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { prisma } from './lib/prisma';
import { Role } from 'discord.js';

const client = new SapphireClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true
});

const main = async () => {
	try {
		const admins = await prisma.user.findMany({
			where: { is_admin: true }
		});
		container.adminIds = admins.map((admin) => admin.discord_id);

		client.logger.info('Logging in');
		await client.login();
		client.logger.info('Logged in');
		client.logger.info('Loading guilds and roles');

		const guild = await client.guilds.fetch(process.env.GUILD_ID!);
		container.guild = guild;

		const roleIds = [
			process.env.BRONZE_ROLE_ID!,
			process.env.SILVER_ROLE_ID!,
			process.env.GOLD_ROLE_ID!,
			process.env.PLATINUM_ROLE_ID!,
			process.env.DIAMOND_ROLE_ID!,
			process.env.RUBY_ROLE_ID!,
			process.env.MASTER_ROLE_ID!
		];

		const roles = await Promise.all(roleIds.map((roleId) => guild.roles.fetch(roleId)));
		container.roles = roles.filter((role): role is Role => role !== null);
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();

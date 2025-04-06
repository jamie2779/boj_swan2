import '@/lib/setup';
import { LogLevel } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { SwanClient } from './structures/SwanClient';

const client = new SwanClient({
	defaultPrefix: '!',
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	loadMessageCommandListeners: true,
	baseUserDirectory: __dirname
});

const main = async () => {
	try {
		await client.login();
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();

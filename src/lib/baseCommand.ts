// src/lib/baseCommand.ts
import { Command } from '@sapphire/framework';
import { config } from 'dotenv';
import { SlashCommandBuilder } from '@discordjs/builders';

config();

export abstract class BaseCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: SlashCommandBuilder) => this.createChatInput(builder), {
			guildIds: process.env.GUILD_ID ? [process.env.GUILD_ID] : undefined
		});
	}

	protected abstract createChatInput(builder: SlashCommandBuilder): SlashCommandBuilder;
}

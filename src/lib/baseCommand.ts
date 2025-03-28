// src/lib/baseCommand.ts
import { Command } from '@sapphire/framework';
import { config } from 'dotenv';
import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from '@discordjs/builders';

config();

export abstract class BaseCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			cooldownFilteredUsers: process.env.ADMIN_ID ? [process.env.ADMIN_ID] : [],
			...options
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: SlashCommandBuilder) => this.createChatInput(builder), {
			guildIds: process.env.GUILD_ID ? [process.env.GUILD_ID] : undefined
		});
	}

	protected abstract createChatInput(
		builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder
	): SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
}

// src/lib/baseCommand.ts
import { Command, container } from '@sapphire/framework';
import { config } from 'dotenv';
import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from '@discordjs/builders';

config();

export abstract class BaseCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			cooldownFilteredUsers: container.adminIds,
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

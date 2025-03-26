import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export class PingCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['guestOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder): SlashCommandBuilder {
		return builder.setName('등록').setDescription('신규유저 등록');
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const modal = new ModalBuilder().setCustomId('register-modal').setTitle('유저 등록');

		const handle = new TextInputBuilder().setCustomId('handle').setLabel('백준 아이디').setStyle(TextInputStyle.Short).setRequired(true);

		modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(handle));

		await interaction.showModal(modal);
	}
}

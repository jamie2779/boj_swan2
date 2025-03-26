import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { isMessageInstance } from '@sapphire/discord.js-utilities';

export class PingCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder): SlashCommandBuilder {
		return builder.setName('ping').setDescription('Ping bot to see if it is alive');
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const msg = await interaction.reply({ content: `Ping?`, ephemeral: true, fetchReply: true });

		if (isMessageInstance(msg)) {
			const diff = msg.createdTimestamp - interaction.createdTimestamp;
			const ping = Math.round(this.container.client.ws.ping);
			return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
		}

		return interaction.editReply('Failed to retrieve ping :(');
	}
}

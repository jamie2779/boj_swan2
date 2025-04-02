import { Command, BucketScope } from '@sapphire/framework';
import { BaseCommand } from '@/lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { refreshAllUser } from '@/lib/api';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'], cooldownDelay: 3_600_000, cooldownScope: BucketScope.Guild });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder.setName('강제갱신').setDescription('유저 및 문제 정보를 모두 갱신합니다(쿨타임 1시간)');
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		try {
			await refreshAllUser();
			return interaction.editReply('갱신 완료');
		} catch (e) {
			return interaction.editReply('갱신 중 오류가 발생했습니다');
		}
	}
}

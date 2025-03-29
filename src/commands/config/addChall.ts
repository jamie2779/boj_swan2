import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { prisma } from '../../lib/prisma';
import { addProblems } from '../../lib/api';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['adminOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('addchall')
			.setDescription('도전문제를 등록합니다(관리자 전용)')
			.addNumberOption((option) =>
				option.setName('group_id').setDescription('그룹 번호를 입력해주세요(1~4)').setRequired(true).setMinValue(0).setMaxValue(4)
			)
			.addStringOption((option) => option.setName('problem_id').setDescription('문제 ID를 입력해주세요(콤마로 구분)').setRequired(true));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const problem_id = interaction.options.getString('problem_id', true);
		const group_id = interaction.options.getNumber('group_id', true);
		const problemIds = problem_id
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id !== '');
		const problemIdsInt = problemIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
		if (problemIdsInt.length === 0) {
			return interaction.reply({ content: '문제 ID가 유효하지 않습니다.', ephemeral: true });
		}
		if (problemIdsInt.length > 20) {
			return interaction.reply({ content: '한번에 최대 20개까지 등록할 수 있습니다.', ephemeral: true });
		}
		await interaction.deferReply({ ephemeral: true });

		const existingProblems = await prisma.problem.findMany({
			where: {
				id: { in: problemIdsInt }
			}
		});

		const nonExistingProblems = problemIdsInt.filter((id) => !existingProblems.some((problem) => problem.id === id));
		if (nonExistingProblems.length > 0) {
			await addProblems(nonExistingProblems);
		}

		const updateResult = await prisma.problem.updateMany({
			where: {
				id: { in: problemIdsInt }
			},
			data: {
				challenge: group_id
			}
		});

		return interaction.editReply({
			content: `총 ${updateResult.count - nonExistingProblems.length}개 변경, ${nonExistingProblems.length}개 추가`
		});
	}
}

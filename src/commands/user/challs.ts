import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { prisma } from '../../lib/prisma';
import { EmbedBuilder } from 'discord.js';
import { tierMapping } from '../../lib/tier';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('도전문제')
			.setDescription('도전문제 목록을 확인합니다')
			.addNumberOption((option) =>
				option.setName('group_id').setDescription('그룹 번호를 입력해주세요(1~4)').setRequired(false).setMinValue(1).setMaxValue(4)
			);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const user = await prisma.user.findUnique({
			where: {
				discord_id: interaction.user.id
			},
			include: {
				problemHolders: true
			}
		});

		if (!user) {
			return interaction.reply({ content: '등록되지 않은 유저입니다.', ephemeral: true });
		}

		const group_id = interaction.options.getNumber('group_id', false) || tierMapping[user.tier].challenge;
		if (group_id < 1 || group_id > 4) {
			return interaction.reply({ content: '그룹 번호는 1~4 사이의 숫자여야 합니다.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		const problems = await prisma.problem.findMany({
			where: {
				challenge: group_id
			},
			orderBy: {
				level: 'asc'
			}
		});

		const solvedProblems = problems.filter((problem) => {
			return user.problemHolders.some((holder) => holder.problem_id === problem.id);
		});

		const nonSolvedProblems = problems.filter((problem) => {
			return !user.problemHolders.some((holder) => holder.problem_id === problem.id);
		});

		const embed = new EmbedBuilder()
			.setColor(0xadff2f)
			.setTitle(`도전 문제 (${group_id})`)
			.addFields(
				{
					name: `아직 풀지 않은 문제[${nonSolvedProblems.length}개]`,
					value:
						nonSolvedProblems.length > 0
							? nonSolvedProblems
									.map(
										(problem) =>
											`[[${tierMapping[problem.level].tier}] ${problem.title}](https://www.acmicpc.net/problem/${problem.id})`
									)
									.join('\n')
							: '없음',
					inline: false
				},
				{
					name: `푼 문제[${solvedProblems.length}개]`,
					value:
						solvedProblems.length > 0
							? solvedProblems
									.map(
										(problem) =>
											`[[${tierMapping[problem.level].tier}] ${problem.title}](https://www.acmicpc.net/problem/${problem.id})`
									)
									.join('\n')
							: '없음',
					inline: false
				}
			)
			.setTimestamp()
			.setFooter({ text: `${interaction.user.username}님이 요청`, iconURL: interaction.user.displayAvatarURL() });

		return interaction.editReply({ embeds: [embed] });
	}
}

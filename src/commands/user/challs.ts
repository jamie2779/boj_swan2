import { Command } from '@sapphire/framework';
import { BaseCommand } from '@/lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import prisma from '@/lib/prisma';
import { EmbedBuilder } from 'discord.js';
import { tierMapping } from '@/constants/tier';

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
				problemHolders: {
					where: {
						problem_id: {
							gte: 1000
						}
					}
				}
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

		const solvedProblems = problems.filter((problem) => user.problemHolders.some((holder) => holder.problem_id === problem.id));

		const nonSolvedProblems = problems.filter((problem) => !user.problemHolders.some((holder) => holder.problem_id === problem.id));

		const splitProblemList = (problems: typeof solvedProblems, title: string): { name: string; value: string; inline: boolean }[] => {
			const lines = problems.map((p) => {
				let emojiId = tierMapping[p.level].emojiId;
				let emoji = emojiId ? this.container.client.emojis.cache.get(emojiId) : ' ';

				return `[${emoji} ${p.title}](https://www.acmicpc.net/problem/${p.id})`;
			});
			const fields = [];
			let chunk: string[] = [];
			let currentLength = 0;
			let fieldCount = 1;

			for (const line of lines) {
				if (currentLength + line.length + 1 > 1024) {
					fields.push({
						name: `${title} (${fieldCount})`,
						value: chunk.join('\n'),
						inline: false
					});
					chunk = [line];
					currentLength = line.length;
					fieldCount++;
				} else {
					chunk.push(line);
					currentLength += line.length + 1;
				}
			}

			if (chunk.length > 0) {
				fields.push({
					name: `${title} (${fieldCount})`,
					value: chunk.join('\n'),
					inline: false
				});
			}

			if (fields.length === 0) {
				fields.push({
					name: `${title}`,
					value: '없음',
					inline: false
				});
			}

			return fields;
		};

		const embed = new EmbedBuilder()
			.setColor(0xadff2f)
			.setTitle(`도전 문제 (${group_id})`)
			.addFields(
				...splitProblemList(nonSolvedProblems, `아직 풀지 않은 문제 [${nonSolvedProblems.length}개]`),
				...splitProblemList(solvedProblems, `푼 문제 [${solvedProblems.length}개]`)
			)
			.setTimestamp()
			.setFooter({ text: `${interaction.user.username}님이 요청`, iconURL: interaction.user.displayAvatarURL() });

		return interaction.editReply({ embeds: [embed] });
	}
}

import { Command } from '@sapphire/framework';
import { BaseCommand } from '@/lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import prisma from '@/lib/prisma';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['adminOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('strickrepair')
			.setDescription('스트릭 리페어를 사용합니다(관리자 전용)')
			.addUserOption((option) => option.setName('user').setDescription('유저를 선택해주세요(필수)').setRequired(true))
			.addStringOption((option) => option.setName('date').setDescription('날짜를 입력해주세요(선택)').setRequired(false))
			.addBooleanOption((option) => option.setName('challenge').setDescription('도전문제 완료 여부(선택)').setRequired(false));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const dateString = interaction.options.getString('date', false);
		const targetDate = dateString ? new Date(dateString) : new Date();

		if (isNaN(targetDate.getTime())) {
			return await interaction.reply({ content: '날짜 형식이 잘못되었습니다.', ephemeral: true });
		}

		const targetUser = interaction.options.getUser('user', true);

		const user = await prisma.user.findUnique({
			where: {
				discord_id: targetUser.id
			}
		});
		if (!user) {
			return interaction.reply({ content: '등록되지 않은 유저입니다.', ephemeral: true });
		}

		const completeChallenge = interaction.options.getBoolean('challenge', false) || false;
		await interaction.deferReply({ ephemeral: true });
		try {
			const start = new Date(targetDate);
			start.setHours(6);
			start.setMinutes(0);
			start.setSeconds(0);

			const end = new Date(start);
			end.setDate(end.getDate() + 1);

			const holders = await prisma.problemHolder.findMany({
				where: {
					user_id: user.id,
					problem_id: {
						equals: 0
					},
					create_date: {
						gte: start,
						lt: end
					}
				}
			});

			if (holders.length === 0) {
				await prisma.problemHolder.create({
					data: {
						create_date: start,
						user_id: user.id,
						problem_id: 0,
						strick: true,
						challenge: completeChallenge
					}
				});
				return await interaction.editReply({ content: '스트릭 리페어가 완료되었습니다.' });
			} else {
				await prisma.problemHolder.updateMany({
					where: {
						user_id: user.id,
						problem_id: 0,
						create_date: {
							gte: start,
							lt: end
						}
					},
					data: {
						strick: true,
						challenge: completeChallenge
					}
				});
				return await interaction.editReply({ content: '스트릭 리페어가 수정되었습니다.' });
			}
		} catch (e) {
			return await interaction.editReply({ content: `스트릭 리페어 사용에 실패했습니다 ${e}` });
		}
	}
}

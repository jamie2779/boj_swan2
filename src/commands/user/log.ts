import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { prisma } from '../../lib/prisma';
import { fineExp } from '../../lib/api';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'], cooldownDelay: 300_000 });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('기록')
			.setDescription('특정 유저의 특정 주 기록을 확인합니다')
			.addUserOption((option) => option.setName('user').setDescription('유저를 선택해주세요(선택)').setRequired(false))
			.addStringOption((option) => option.setName('date').setDescription('날짜를 입력해주세요(선택)').setRequired(false));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const dateString = interaction.options.getString('date', false);
		const targetDate = dateString ? new Date(dateString) : new Date();

		if (isNaN(targetDate.getTime())) {
			return await interaction.reply({ content: '날짜 형식이 잘못되었습니다.', ephemeral: true });
		}

		const targetUser = interaction.options.getUser('user', false) || interaction.user;
		const user = await prisma.user.findUnique({
			where: {
				discord_id: targetUser.id
			},
			include: {
				problemHolders: true
			}
		});
		if (!user) {
			return interaction.reply({ content: '등록되지 않은 유저입니다.', ephemeral: true });
		}

		await interaction.deferReply();
		let start;
		if (targetDate.getDay() === 0) {
			start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - targetDate.getDay() - 6, 6);
		} else {
			start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - targetDate.getDay() + 1, 6);
		}

		let content = '';
		let successCount = 0;
		let failCount = 0;
		let challenge = false;
		let finish = true;
		for (let i = 0; i < 7; i++) {
			const _start = new Date(start);
			const _end = new Date(start);
			_start.setDate(_start.getDate() + i);
			_end.setDate(_end.getDate() + i + 1);
			const holders = await prisma.problemHolder.findMany({
				where: {
					user_id: user.id,
					create_date: {
						gte: _start,
						lt: _end
					}
				}
			});
			const strickCount = holders.filter((p) => p.strick).length;
			const challengeCount = holders.filter((p) => p.challenge).length;
			if (challengeCount > 0) {
				challenge = true;
			}
			const now = new Date();
			if (user.create_date > _end) {
				content += `:grey_question: ${_start.toLocaleDateString()} \n`;
			} else if (now < _end) {
				content += `:grey_question: ${_start.toLocaleDateString()}[?문제/?문제]\n`;
				finish = false;
			} else {
				content += `${strickCount > 0 ? ':white_check_mark:' : ':x:'}${_start.toLocaleDateString()}[${strickCount}문제/${holders.length}문제] ${challengeCount > 0 ? ':exclamation:' : ''} \n`;
				if (strickCount > 0) {
					successCount++;
				} else {
					failCount++;
				}
			}
		}

		const fine = fineExp(failCount, challenge || !finish);
		const embed = new EmbedBuilder()
			.setColor(0xadff2f)
			.setTitle(`${user.handle}님의 스트릭 기록`)
			.addFields([
				{
					name: `성공: ${successCount}일, 실패: ${failCount}일, 벌금: ${fine}원 ${finish ? '' : '(진행중)'}`,
					value: content,
					inline: false
				}
			])
			.setTimestamp()
			.setFooter({
				text: `${interaction.user.username}님이 요청`,
				iconURL: interaction.user.displayAvatarURL()
			});

		return interaction.editReply({ embeds: [embed] });
	}
}

import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { prisma } from '../../lib/prisma';
import { culcFine } from '../../lib/api';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('벌금')
			.setDescription('일주일 간의 벌금을 확인합니다.')
			.addStringOption((option) => option.setName('date').setDescription('날짜를 입력해주세요').setRequired(false));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const dateString = interaction.options.getString('date', false);
		const targetDate = dateString ? new Date(dateString) : new Date();

		if (isNaN(targetDate.getTime())) {
			return await interaction.reply({ content: '날짜 형식이 잘못되었습니다.', ephemeral: true });
		}

		await interaction.deferReply();

		const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - targetDate.getDay() + 1, 6);
		const end = new Date(start);
		end.setDate(end.getDate() + 6);

		const users = await prisma.user.findMany({
			where: {
				is_active: true
			},
			include: {
				problemHolders: {
					include: {
						problem: true
					},
					where: {
						strick: true
					}
				}
			}
		});

		let fines = '';
		let fineCount = 0;
		let fineSum = 0;

		for (const user of users) {
			const { fine, challenge } = await culcFine(user, start);
			if (fine > 0) {
				fines += `:x:  ${user.handle} [${fine}원] ${challenge ? ':exclamation:' : ''}\n `;
				fineCount++;
				fineSum += fine;
			} else {
				fines += `:white_check_mark:  ${user.handle} [0원] ${challenge ? ':exclamation:' : ''}\n `;
			}
		}
		const embed = new EmbedBuilder()
			.setColor(0xadff2f)
			.setTitle(`${start.toLocaleDateString()} ~ ${end.toLocaleDateString()} 주간 정산`)
			.addFields([
				{
					name: `인원: ${fineCount}명, 합계: ${fineSum}원`,
					value: fines,
					inline: false
				}
			])
			.setTimestamp()
			.setFooter({
				text: '벌금 목록',
				iconURL: 'https://cdn.discordapp.com/app-icons/1305799574774087691/f87824903ae00ab4727f050de7a59c8b.webp'
			});

		return interaction.editReply({ embeds: [embed] });
	}
}

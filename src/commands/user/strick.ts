import { Command } from '@sapphire/framework';
import { BaseCommand } from '@/lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { prisma } from '@/lib/prisma';
import { updateUser } from '@/lib/api';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'], cooldownDelay: 300_000 });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('스트릭')
			.setDescription('특정 유저의 특정 날짜 스트릭을 확인합니다(쿨타임 5분)')
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
			}
		});
		if (!user) {
			return interaction.reply({ content: '등록되지 않은 유저입니다.', ephemeral: true });
		}

		await interaction.deferReply();

		await updateUser(user);

		//두가지 경우
		//1. targetDate가 6시 이후인 경우, 해당 날짜 6시 부터 다음날 5시59분 까지 스트릭 확인
		//2. targetDate가 6시 이전인 경우, 이전 날짜 6시 부터 해당 날짜 5시 59분 까지 스트릭 확인
		const start = new Date(targetDate);
		if (start.getHours() < 6) {
			start.setDate(start.getDate() - 1);
		}
		start.setHours(6);
		start.setMinutes(0);
		start.setSeconds(0);

		const end = new Date(start);
		end.setDate(end.getDate() + 1);

		const holders = await prisma.problemHolder.findMany({
			where: {
				user_id: user.id,
				create_date: {
					gte: start,
					lt: end
				}
			}
		});

		const strickCount = holders.filter((p) => p.strick).length;

		const embed = new EmbedBuilder()
			.setColor(strickCount > 0 ? 0xadff2f : 0xff0000)
			.setTitle(`${user.handle}님이 ${start.toLocaleDateString()}의 문제를 ${strickCount > 0 ? '풀었습니다' : '풀지 않았습니다'}`)
			.setDescription(`푼 문제 수: ${holders.length}, 조건에 맞는 문제 수: ${strickCount}`)
			.setTimestamp()
			.setFooter({
				text: `${interaction.user.username}님이 요청`,
				iconURL: interaction.user.displayAvatarURL()
			});

		return interaction.editReply({ embeds: [embed] });
	}
}

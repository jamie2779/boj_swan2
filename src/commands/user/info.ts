import { Command } from '@sapphire/framework';
import { BaseCommand } from '../../lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { prisma } from '../../lib/prisma';
import { tierMapping } from '../../lib/tier';

export class InfoCommand extends BaseCommand {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['userOnly'] });
	}

	protected createChatInput(builder: SlashCommandBuilder) {
		return builder
			.setName('정보')
			.setDescription('유저의 정보를 확인합니다.')
			.addUserOption((option) => option.setName('user').setDescription('유저를 선택해주세요(선택)').setRequired(false));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
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
		const embed = new EmbedBuilder()
			.setColor(tierMapping[user.tier].color)
			.setTitle(`${targetUser.username}님의 정보`)
			.setThumbnail(user.profile_img)
			.setDescription(`https://solved.ac/profile/${user.handle}`)
			.addFields(
				{ name: '디스코드 닉네임', value: `${targetUser.displayName}`, inline: true },
				{ name: 'BOJ 핸들', value: `${user.handle}`, inline: true },
				{ name: '자기소개', value: `${user.bio}`, inline: false },
				{ name: '푼 문제 수', value: `${user.solved_count}`, inline: true },
				{ name: '티어', value: `${tierMapping[user.tier].tier}`, inline: true },
				{ name: '레이팅', value: `${user.rating}`, inline: true },
				{ name: '등록 날짜', value: `${user.create_date.toLocaleDateString()}`, inline: false }
			)
			.setTimestamp()
			.setFooter({ text: `${interaction.user.username}님이 요청`, iconURL: interaction.user.displayAvatarURL() });

		return interaction.editReply({ embeds: [embed] });
	}
}

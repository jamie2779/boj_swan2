import { Command } from '@sapphire/framework';
import { BaseCommand } from '@/lib/baseCommand';
import { SlashCommandBuilder } from '@discordjs/builders';
import prisma from '@/lib/prisma';
import { Role, GuildMember, User } from 'discord.js';

export class InfoCommand extends BaseCommand {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, preconditions: ['adminOnly'] });
  }

  protected createChatInput(builder: SlashCommandBuilder) {
    return builder
      .setName('strickrepair')
      .setDescription('스트릭 리페어를 사용합니다(관리자 전용)')
      .addMentionableOption((option) =>
        option.setName('user').setDescription('유저 또는 @everyone(필수)').setRequired(true)
      )
      .addStringOption((option) =>
        option.setName('date').setDescription('날짜를 입력해주세요(선택)').setRequired(false)
      )
      .addBooleanOption((option) =>
        option.setName('challenge').setDescription('도전문제 완료 여부(선택)').setRequired(false)
      );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const dateString = interaction.options.getString('date', false);
    const targetDate = dateString ? new Date(dateString) : new Date();
    if (isNaN(targetDate.getTime())) {
      return await interaction.reply({ content: '날짜 형식이 잘못되었습니다.', ephemeral: true });
    }

    const mentionable = interaction.options.getMentionable('user', true);
    const challenge = interaction.options.getBoolean('challenge', false) || false;

    const start = new Date(targetDate);
    start.setHours(6, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    await interaction.deferReply({ ephemeral: true });

    try {
      const isAll =
        interaction.guild != null &&
        mentionable instanceof Role &&
        mentionable.id === interaction.guild.id;

      if (isAll) {
        const allUsers = await prisma.user.findMany({ select: { id: true } });
        if (allUsers.length === 0) {
          return await interaction.editReply({ content: '등록된 사용자가 없습니다.' });
        }

        const userIds = allUsers.map((u) => u.id);
        const existing = await prisma.problemHolder.findMany({
          where: {
            user_id: { in: userIds },
            problem_id: 0,
            create_date: { gte: start, lt: end }
          },
          select: { user_id: true }
        });

        const existSet = new Set(existing.map((e) => e.user_id));
        const toCreate = userIds.filter((id) => !existSet.has(id));
        const toUpdate = userIds.filter((id) => existSet.has(id));

        if (toCreate.length > 0) {
          await prisma.problemHolder.createMany({
            data: toCreate.map((id) => ({
              create_date: start,
              user_id: id,
              problem_id: 0,
              strick: true,
              challenge
            })),
            skipDuplicates: true
          });
        }

        if (toUpdate.length > 0) {
          await prisma.problemHolder.updateMany({
            where: {
              user_id: { in: toUpdate },
              problem_id: 0,
              create_date: { gte: start, lt: end }
            },
            data: { strick: true, challenge }
          });
        }

        return await interaction.editReply({ content: '스트릭 리페어(전체) 완료' });
      }

      let selectedUser: User | null = null;
      if (mentionable instanceof GuildMember) selectedUser = mentionable.user;
      else if (mentionable instanceof User) selectedUser = mentionable;

      if (!selectedUser) {
        return await interaction.editReply({
          content: '유저를 선택해주세요. (@everyone은 전체 처리입니다)'
        });
      }

      const user = await prisma.user.findUnique({
        where: { discord_id: selectedUser.id }
      });
      if (!user) {
        return await interaction.editReply({ content: '등록되지 않은 유저입니다.' });
      }

      const holders = await prisma.problemHolder.findMany({
        where: {
          user_id: user.id,
          problem_id: 0,
          create_date: { gte: start, lt: end }
        }
      });

      if (holders.length === 0) {
        await prisma.problemHolder.create({
          data: {
            create_date: start,
            user_id: user.id,
            problem_id: 0,
            strick: true,
            challenge
          }
        });
        return await interaction.editReply({ content: '스트릭 리페어가 완료되었습니다.' });
      } else {
        await prisma.problemHolder.updateMany({
          where: {
            user_id: user.id,
            problem_id: 0,
            create_date: { gte: start, lt: end }
          },
          data: { strick: true, challenge }
        });
        return await interaction.editReply({ content: '스트릭 리페어가 수정되었습니다.' });
      }
    } catch (e) {
      return await interaction.editReply({ content: `스트릭 리페어 사용에 실패했습니다 ${e}` });
    }
  }
}
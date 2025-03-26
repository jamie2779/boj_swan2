import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../lib/prisma';

export class IsNewUserPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const userId = interaction.user.id;
		const existingUser = await prisma.user.findUnique({
			where: {
				discord_id: userId
			}
		});

		if (existingUser) {
			// 유저가 DB에 있으면 성공
			return this.ok();
		}

		// 유저가 이미 존재하면 실패
		return this.error({
			message: '등록되지 않은 유저입니다.'
		});
	}
}

import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import prisma from '@/lib/prisma';

export class IsNewUserPrecondition extends Precondition {
	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const userId = interaction.user.id;
		const existingUser = await prisma.user.findUnique({
			where: {
				discord_id: userId
			}
		});

		if (existingUser) {
			if (existingUser.is_admin) {
				return this.ok();
			}
			return this.error({
				message: '관리자만 사용할 수 있는 명령어입니다.'
			});
		}

		return this.error({
			message: '등록되지 않은 유저입니다.'
		});
	}
}

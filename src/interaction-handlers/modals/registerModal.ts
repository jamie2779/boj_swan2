import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ModalSubmitInteraction } from 'discord.js';
import { getSolvedUser, saveSolvedProblems } from '../../lib/api';
import { User, ProblemHolder } from '@prisma/client';

export class RegisterModalHandler extends InteractionHandler {
	public constructor(context: InteractionHandler.Context, options: InteractionHandler.Options) {
		super(context, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.ModalSubmit
		});
	}

	public override parse(interaction: ModalSubmitInteraction) {
		return interaction.customId === 'register-modal' ? this.some() : this.none();
	}

	public async run(interaction: ModalSubmitInteraction) {
		const handle = interaction.fields.getTextInputValue('handle');
		let user: (User & { problemHolders: ProblemHolder[] }) | null;
		try {
			await interaction.deferReply({ ephemeral: true });
			const solvedUser = await getSolvedUser(handle);
			const userId = interaction.user.id;
			await this.container.prisma.user.create({
				data: {
					discord_id: userId,
					handle: solvedUser.handle,
					tier: solvedUser.tier,
					rating: solvedUser.rating,
					bio: solvedUser.bio,
					solved_count: solvedUser.solvedCount,
					profile_img: solvedUser.profileImageUrl || 'https://static.solved.ac/misc/360x360/default_profile.png'
				}
			});

			user = await this.container.prisma.user.findUnique({
				where: { discord_id: userId },
				include: { problemHolders: true }
			});

			if (!user) throw new Error('등록된 유저를 찾을 수 없습니다.');
			await interaction.editReply({ content: '유저 등록이 완료되었습니다!' });
		} catch (_e) {
			const e = _e as Error;
			return await interaction.editReply({ content: `등록에 실패했습니다, ${e.message}` });
		}

		try {
			return await saveSolvedProblems(user);
		} catch (_e) {
			const e = _e as Error;
			console.log(`문제 등록 중 오류 발생, ${e.message}`);
			return;
		}
	}
}

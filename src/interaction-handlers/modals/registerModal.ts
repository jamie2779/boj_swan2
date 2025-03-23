import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import { getSolvedUser } from '../../lib/solved';

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
		try {
			const user = await getSolvedUser(handle);
			const userId = interaction.user.id;
			await this.container.prisma.user.create({
				data: {
					discord_id: userId,
					handle: user.handle,
					tier: user.tier,
					rating: user.rating,
					bio: user.bio,
					solved_count: user.solvedCount,
					profile_img: user.profileImageUrl
				}
			});
			return await interaction.reply({ content: '정상적으로 등록되었습니다!', ephemeral: true });
		} catch (e) {
			return await interaction.reply({ content: '등록에 실패했습니다, 아이디를 다시 확인해주세요', ephemeral: true });
		}
	}
}

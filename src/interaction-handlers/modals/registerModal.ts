import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';
import axios from 'axios';

// interface SolvedUser {
// 	handle: string;
// 	bio: string;
// 	verified: boolean;
// 	badgeId: string;
// 	backgroundId: string;
// 	profileImageUrl: string | null;
// 	solvedCount: number;
// 	voteCount: number;
// 	class: number;
// 	classDecoration: string;
// 	rivalCount: number;
// 	reverseRivalCount: number;
// 	tier: number;
// 	rating: number;
// 	ratingByProblemsSum: number;
// 	ratingByClass: number;
// 	ratingBySolvedCount: number;
// 	ratingByVoteCount: number;
// 	arenaTier: number;
// 	arenaRating: number;
// 	arenaMaxTier: number;
// 	arenaMaxRating: number;
// 	arenaCompetedRoundCount: number;
// 	maxStreak: number;
// 	coins: number;
// 	stardusts: number;
// 	joinedAt: string; // ISO8601 날짜 문자열
// 	bannedUntil: string;
// 	proUntil: string;
// 	rank: number;
// 	isRival: boolean;
// 	isReverseRival: boolean;
// 	blocked: boolean;
// 	reverseBlocked: boolean;
// }

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
			const res = await axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`);
			const user = res.data;
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
			if (axios.isAxiosError(e) && e.response?.status === 404) {
				return await interaction.reply({ content: '등록에 실패했습니다. 백준 아이디를 다시 확인해주세요', ephemeral: true });
			}
			return await interaction.reply({ content: '등록에 실패했습니다. 나중에 다시 시도해주세요', ephemeral: true });
		}
	}
}

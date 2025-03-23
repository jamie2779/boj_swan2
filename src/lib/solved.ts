import axios from 'axios';

interface SolvedUser {
	handle: string;
	bio: string;
	verified: boolean;
	badgeId: string;
	backgroundId: string;
	profileImageUrl: string | null;
	solvedCount: number;
	voteCount: number;
	class: number;
	classDecoration: string;
	rivalCount: number;
	reverseRivalCount: number;
	tier: number;
	rating: number;
	ratingByProblemsSum: number;
	ratingByClass: number;
	ratingBySolvedCount: number;
	ratingByVoteCount: number;
	arenaTier: number;
	arenaRating: number;
	arenaMaxTier: number;
	arenaMaxRating: number;
	arenaCompetedRoundCount: number;
	maxStreak: number;
	coins: number;
	stardusts: number;
	joinedAt: string; // ISO8601 날짜 문자열
	bannedUntil: string;
	proUntil: string;
	rank: number;
	isRival: boolean;
	isReverseRival: boolean;
	blocked: boolean;
	reverseBlocked: boolean;
}

/**
 * 핸들 이용해서 유저 정보 가져오는 함수
 * @param handle Solve.ac 유저의 핸들
 * @returns
 */
export async function getSolvedUser(handle: string) {
	try {
		const res = await axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`);
		const user = res.data;
		return user as SolvedUser;
	} catch (e) {
		if (axios.isAxiosError(e) && e.response?.status === 404) {
			throw new Error('존재하지 않는 아이디입니다.');
		}
		throw new Error('나중에 다시 시도해주세요.');
	}
}

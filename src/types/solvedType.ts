export interface SolvedUser {
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

export interface SolvedProblemList {
	count: number;
	items: SolvedProblem[];
}

export interface SolvedProblem {
	problemId: number;
	titleKo: string;
	titles: LocalizedTitle[];
	isSolvable: boolean;
	isPartial: boolean;
	acceptedUserCount: number;
	level: number;
	votedUserCount: number;
	sprout: boolean;
	givesNoRating: boolean;
	isLevelLocked: boolean;
	averageTries: number;
	official: boolean;
	tags: Tag[];
	metadata: Record<string, unknown>;
}

export interface LocalizedTitle {
	language: string;
	languageDisplayName: string;
	title: string;
	isOriginal: boolean;
}

export interface Tag {
	key: string;
	isMeta: boolean;
	bojTagId: number;
	problemCount: number;
	displayNames: DisplayName[];
	aliases: Alias[];
}

export interface DisplayName {
	language: string;
	name: string;
	short: string;
}

export interface Alias {
	alias: string;
}

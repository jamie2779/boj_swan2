import axios from 'axios';
import { User, ProblemHolder } from '@prisma/client';
import { SolvedUser, SolvedProblemList, SolvedProblem } from '@/types/solvedType';
import prisma from '@/lib/prisma';
import { tierMapping } from '@/constants/tier';
import { container } from '@sapphire/framework';

/**
 * 핸들 이용해서 유저 정보 가져오는 함수
 * @param handle Solve.ac 유저의 핸들
 * @returns
 */
export async function getSolvedUser(handle: string) {
	try {
		const res = await axios.get(`https://solved.ac/api/v3/user/show?handle=${handle}`);
		const data = res.data as SolvedUser;
		return data;
	} catch (e) {
		if (axios.isAxiosError(e) && e.response?.status === 404) {
			throw new Error('존재하지 않는 아이디입니다.');
		}
		throw new Error('유저 정보를 가져오는 중 오류가 발생했습니다.');
	}
}

/**
 * Solve.ac에서 유저가 푼 문제를 가져와 DB에 저장
 * @param user DB에서 가져온 User + ProblemHolder 정보
 * @returns 최신 ProblemHolder 리스트
 */
export async function saveSolvedProblems(user: User & { problemHolders: ProblemHolder[] }, date: Date = new Date()) {
	const problems: SolvedProblem[] = [];
	try {
		const url = `https://solved.ac/api/v3/search/problem?query=@${user.handle}&direction=asc&page=1&sort=id`;
		const res = await axios.get(url);
		const data = res.data as SolvedProblemList;
		problems.push(...data.items);

		if (user.problemHolders.length === data.count) return user.problemHolders;
		const last_page = Math.ceil(data.count / 50);
		for (let page = 2; page <= last_page; page++) {
			try {
				const url = `https://solved.ac/api/v3/search/problem?query=@${user.handle}&direction=asc&page=${page}&sort=id`;
				const res = await axios.get(url);
				const data = res.data as SolvedProblemList;
				problems.push(...data.items);
			} catch (e) {
				throw new Error('문제 정보를 가져오는 중 오류가 발생했습니다.');
			}
		}

		// 이미 저장된 문제 ID 확인
		const existingProblemIds = new Set(user.problemHolders.map((ph) => ph.problem_id));
		const newProblems = problems.filter((p) => !existingProblemIds.has(p.problemId));

		if (newProblems.length === 0) return user.problemHolders;

		// Problem 테이블에 존재하는 문제 ID 확인
		const existingProblems = await prisma.problem.findMany({
			where: {
				id: { in: newProblems.map((p) => p.problemId) }
			},
			select: {
				id: true,
				challenge: true,
				level: true
			}
		});
		const existingProblemMap = new Map(existingProblems.map((p) => [p.id, p]));

		// 2. Problem 테이블에 새로 추가할 문제 목록 만들기
		const problemsToCreate = newProblems.filter((p) => !existingProblemMap.has(p.problemId));

		// 3. 문제 새로 추가
		if (problemsToCreate.length > 0) {
			await prisma.problem.createMany({
				data: problemsToCreate.map((p) => ({
					id: p.problemId,
					title: p.titleKo,
					level: p.level
				})),
				skipDuplicates: true
			});
		}

		// 4. ProblemHolder 테이블에 새로 추가
		await prisma.problemHolder.createMany({
			data: newProblems.map((p) => {
				const problem = existingProblemMap.get(p.problemId);
				const level = p.level;
				const strick = level >= tierMapping[user.tier].limit;

				const challengeValue = problem?.challenge ?? 0;
				const challenge = challengeValue >= tierMapping[user.tier].challenge;

				return {
					user_id: user.id,
					problem_id: p.problemId,
					create_date: date,
					strick,
					challenge
				};
			}),
			skipDuplicates: true
		});
		// 최신 ProblemHolder 리스트 반환
		const updatedHolders = await prisma.problemHolder.findMany({
			where: {
				user_id: user.id
			}
		});
		return updatedHolders;
	} catch (e) {
		console.log(e);
		throw new Error('문제 정보를 등록하는 중 오류가 발생했습니다.');
	}
}

/**
 * 특정 유저의 정보 업데이트
 * @param user 업데이트할 유저 객체
 * @returns 업데이트 이후 유저 객체
 */
export async function updateUser(user: User) {
	const solvedUser = await getSolvedUser(user.handle);

	//정보가 달라진게 있을때만 업데이트
	if (
		solvedUser.tier === user.tier &&
		solvedUser.rating === user.rating &&
		solvedUser.bio === user.bio &&
		solvedUser.solvedCount === user.solved_count &&
		solvedUser.profileImageUrl === user.profile_img
	) {
		return user;
	}

	const updatedUser = await prisma.user.update({
		where: { id: user.id },
		data: {
			tier: solvedUser.tier,
			rating: solvedUser.rating,
			bio: solvedUser.bio,
			solved_count: solvedUser.solvedCount,
			profile_img: solvedUser.profileImageUrl || 'https://static.solved.ac/misc/360x360/default_profile.png'
		}
	});

	await updateUserRole(updatedUser);
	return updatedUser;
}

/**
 * active한 모든 유저의 정보 업데이트
 * @param date 문제 등록 기준 날짜
 */
export async function refreshAllUser(date: Date = new Date()) {
	const users = await prisma.user.findMany({
		where: {
			is_active: true
		},
		include: {
			problemHolders: true
		}
	});
	for (const user of users) {
		await updateUser(user);
		await saveSolvedProblems(user, date);
	}
}

/**
 * 특정 유저의 특정 기간 벌금 계산
 * @param user 대상 유저
 * @param date 대상 날짜(해당 날짜가 포함된 주 기준으로 진행, 기본값은 현재 날짜)
 * @returns { successCount, failCount, fine, challenge, finish, start, end}
 */
export async function culcFine(user: User & { problemHolders: ProblemHolder[] }, date: Date = new Date()) {
	let start;
	if (date.getDay() === 0) {
		start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() - 6, 6);
	} else {
		start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 1, 6);
	}
	const end = new Date(start);
	end.setDate(end.getDate() + 6);

	let successCount = 0;
	let failCount = 0;
	let challenge = false;
	let finish = true;
	for (let i = 0; i < 7; i++) {
		const _start = new Date(start);
		const _end = new Date(start);
		_start.setDate(_start.getDate() + i);
		_end.setDate(_end.getDate() + i + 1);
		const holders = user.problemHolders.filter((p) => p.create_date >= _start && p.create_date < _end);
		const strickCount = holders.filter((p) => p.strick).length;
		const challengeCount = holders.filter((p) => p.challenge).length;
		if (challengeCount > 0) {
			challenge = true;
		}
		const now = new Date();
		if (user.create_date > _end) {
			continue;
		} else if (now < _end) {
			finish = false;
		} else {
			if (strickCount > 0) {
				successCount++;
			} else {
				failCount++;
			}
		}
	}

	return { successCount, failCount, fine: fineExp(failCount, challenge || !finish), challenge, finish, start, end };
}

/**
 * 벌금 계산 식
 * @param n 한 주에 풀지 않은 횟수
 * @param challenge 도전문제 달성 여부
 * @returns 계산된 벌금
 */
export function fineExp(n: number, challenge: boolean): number {
	if (n === 0) return 0;
	else return 1000 * 2 ** Math.min(4, n) + (challenge ? 0 : 2000);
}

/**
 * 문제 ID 리스트를 받아서 DB에 문제 정보를 추가하는 함수
 * @param problems 문제 ID 리스트
 */
export async function addProblems(problems: number[]) {
	const problemList = [];
	try {
		const problemIds = problems.join('|');
		const url = `https://solved.ac/api/v3/search/problem?query=id:${problemIds}&direction=asc&page=1&sort=id`;
		const res = await axios.get(url);
		const data = res.data as SolvedProblemList;
		problemList.push(...data.items);
	} catch (e) {
		throw new Error('문제 정보를 가져오는 중 오류가 발생했습니다.');
	}
	try {
		// 이미 저장된 문제 ID 확인
		const existingProblems = await prisma.problem.findMany({
			where: {
				id: { in: problems }
			},
			select: {
				id: true
			}
		});
		const existingProblemIdSet = new Set(existingProblems.map((p) => p.id));
		// 아직 Problem 테이블에 없는 문제만 선별
		const problemsToCreate = problemList.filter((p) => !existingProblemIdSet.has(p.problemId));
		// Problem 테이블에 새로 추가
		if (problemsToCreate.length > 0) {
			await prisma.problem.createMany({
				data: problemsToCreate.map((p) => ({
					id: p.problemId,
					title: p.titleKo,
					level: p.level
				}))
			});
		}
	} catch (e) {
		throw new Error('문제 정보를 등록하는 중 오류가 발생했습니다.');
	}
}

/**
 * 유저의 디스코드 역할을 업데이트 합니다
 * @param user 유저 객체
 */
export async function updateUserRole(user: User) {
	try {
		if (user.tier == 0) return;
		const member = await container.guild.members.fetch(user.discord_id).catch(() => null);
		if (!member) return;
		const roles = container.roles;
		if (!roles) return;
		const index = Math.floor((user.tier - 1) / 5);
		const targetRole = roles[index];
		for (const role of roles) {
			if (member.roles.cache.has(role.id) && role.id !== targetRole.id) {
				await member.roles.remove(role);
			}
			if (!member.roles.cache.has(targetRole.id) && role.id === targetRole.id) {
				await member.roles.add(role);
			}
		}
	} catch (e) {
		console.log(e);
		throw new Error('유저 역할 업데이트 중 오류가 발생했습니다.');
	}
}

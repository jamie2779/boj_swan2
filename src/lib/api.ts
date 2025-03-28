import axios from 'axios';
import { User, ProblemHolder, Problem } from '@prisma/client';
import { SolvedUser, SolvedProblemList, SolvedProblem } from './solvedType';
import { prisma } from './prisma';
import { tierMapping } from './tier';
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
				id: true
			}
		});
		const existingProblemIdSet = new Set(existingProblems.map((p) => p.id));

		// 아직 Problem 테이블에 없는 문제만 선별
		const problemsToCreate = newProblems.filter((p) => !existingProblemIdSet.has(p.problemId));
		// Problem 테이블에 새로 추가
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

		// ProblemHolder 테이블에 새로 추가
		await prisma.problemHolder.createMany({
			data: newProblems.map((p) => ({
				user_id: user.id,
				problem_id: p.problemId,
				create_date: date,
				strick: p.level >= tierMapping[user.tier].limit
			})),
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
 * @returns
 */
export async function culcFine(user: User & { problemHolders: (ProblemHolder & { problem: Problem })[] }, date: Date = new Date()) {
	//1. date가 포함된 주의 월요일 오전 6시 ~ 다음주 월요일 오전 6시 기준 시간 계산
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 1, 6);
	const end = new Date(start);
	end.setDate(end.getDate() + 7);

	//2. user의 ProblemHolders 중 해당 기간의 문제들을 필터링
	const filteredProblems = user.problemHolders.filter((p) => p.strick && p.create_date >= start && p.create_date < end);

	//3. start부터 end 까지 하루씩 돌아가며 해당 일에 strick이 있는지 보고 스트릭이0인 경우 카운트
	let notStrickCount = 0;
	for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
		if (d < user.create_date) continue;
		if (d > date) break;
		const nextDay = new Date(d);
		nextDay.setDate(d.getDate() + 1);
		const strick = filteredProblems.some((p) => d <= p.create_date && p.create_date < nextDay);
		if (!strick) notStrickCount++;
	}
	//4. filteredProblems에 있는 문제들 중 challenge가 1 이상인 경우가 있는지 판단
	const hasChallenge = filteredProblems.some((p) => p.problem.challenge > 0);
	//5. 벌금 계산 후 반환
	if (notStrickCount === 0) return { fine: 0, challenge: hasChallenge };
	else return { fine: 1000 * 3 ** Math.min(3, notStrickCount), challenge: hasChallenge };
}

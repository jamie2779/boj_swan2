import axios from 'axios';
import { User, ProblemHolder } from '@prisma/client';
import { SolvedUser, SolvedProblemList, SolvedProblem } from './solvedType';
import { prisma } from './prisma';
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
				const url = `https://solved.ac/api/v3/search/problem?query=@${user.handle}&direction=asc&page=1&sort=id`;
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
				create_date: date
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

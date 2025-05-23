import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { StoreRegistryValue } from '@sapphire/pieces';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { CronJob } from 'cron';
import type { Role, TextChannel } from 'discord.js';
import { refreshAllUser, culcFine } from '@/lib/api';
import { EmbedBuilder } from 'discord.js';
import prisma from '@/lib/prisma';

const dev = process.env.NODE_ENV !== 'production';

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public override async run() {
		this.printBanner();
		this.printStoreDebugInformation();
		await this.setupInitialData();
		await refreshAllUser();
		this.initCronJobs();
	}

	private async setupInitialData() {
		this.container.client.logger.info('Loading guilds and roles');

		const guild = await this.container.client.guilds.fetch(process.env.GUILD_ID!);
		this.container.guild = guild;

		const roleIds = [
			process.env.BRONZE_ROLE_ID!,
			process.env.SILVER_ROLE_ID!,
			process.env.GOLD_ROLE_ID!,
			process.env.PLATINUM_ROLE_ID!,
			process.env.DIAMOND_ROLE_ID!,
			process.env.RUBY_ROLE_ID!,
			process.env.MASTER_ROLE_ID!
		];

		const roles = await Promise.all(roleIds.map((roleId) => guild.roles.fetch(roleId)));
		this.container.roles = roles.filter((role): role is Role => role !== null);

		this.container.client.logger.info('Loaded guilds and roles');

		this.container.client.logger.info('Loading admins');

		const admins = await this.container.prisma.user.findMany({
			where: { is_admin: true }
		});
		this.container.adminIds = admins.map((admin) => admin.discord_id);

		this.container.client.logger.info('Loaded admins');
	}

	private printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: StoreRegistryValue, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}

	private initCronJobs() {
		const channelId = process.env.NOTIFY_CHANNEL_ID || '';

		// 공통 메시지 전송 함수
		const sendMessage = async (message: string | Object) => {
			const channel = await this.container.client.channels.fetch(channelId);
			if (!channel?.isTextBased()) {
				this.container.logger.error('공지 채널을 찾을 수 없거나 텍스트 채널이 아닙니다.');
				return;
			}
			await (channel as TextChannel).send(message);
		};

		// 크론 작업 설정
		const cronJobs = [
			new CronJob('00 6 * * *', async () => {
				try {
					const now = new Date();
					await refreshAllUser(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 59));
					const users = await prisma.user.findMany({
						where: {
							is_active: true
						},
						include: {
							problemHolders: {
								where: {
									create_date: {
										gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 6),
										lt: now
									}
								}
							}
						}
					});

					let stricks = '';
					let strickCount = 0;
					let notStrickCount = 0;

					for (const user of users) {
						const filteredProblems = user.problemHolders.filter((p) => p.strick);
						const challengeProblems = user.problemHolders.filter((p) => p.challenge);
						const realProblems = user.problemHolders.filter((p) => p.problem_id >= 1000);
						const realStrickPoblems = realProblems.filter((p) => p.strick);
						if (filteredProblems.length > 0) {
							stricks += `:white_check_mark:  ${user.handle} [${realStrickPoblems.length}문제/${realProblems.length}문제] ${challengeProblems.length > 0 ? '!' : ''}\n `;
							strickCount++;
						} else {
							stricks += `:x:  ${user.handle} [${realStrickPoblems.length}문제/${realProblems.length}문제] ${challengeProblems.length > 0 ? '!' : ''}\n `;
							notStrickCount++;
						}
					}
					const embed = new EmbedBuilder()
						.setColor(0xadff2f)
						.setTitle(`${new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 6).toLocaleDateString('ko-KR')} 스트릭 목록`)
						.addFields([
							{
								name: `성공: ${strickCount}명, 실패: ${notStrickCount}명`,
								value: stricks,
								inline: false
							}
						])
						.setTimestamp()
						.setFooter({
							text: '스트릭 알림',
							iconURL: 'https://cdn.discordapp.com/app-icons/1305799574774087691/f87824903ae00ab4727f050de7a59c8b.webp'
						});
					sendMessage({ embeds: [embed] });
				} catch (e) {
					console.log(e);
				}
			}),
			new CronJob('55 * * * *', async () => {
				try {
					await refreshAllUser(new Date());
				} catch (e) {
					console.log(e);
				}
			}),
			new CronJob('5 6 * * 1', async () => {
				try {
					const now = new Date();
					const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 5, 6);
					const end = new Date(start);
					end.setDate(end.getDate() + 6);

					const users = await prisma.user.findMany({
						where: {
							is_active: true
						},
						include: {
							problemHolders: {
								where: {
									OR: [{ strick: true }, { challenge: true }]
								}
							}
						}
					});

					let fines = '';
					let fineCount = 0;
					let fineSum = 0;

					for (const user of users) {
						const { fine, challenge } = await culcFine(user, start);
						if (fine > 0) {
							fines += `:x: ${user.handle} [${fine}원] ${challenge ? '!' : ''}\n `;
							fineCount++;
							fineSum += fine;
						} else {
							fines += `:white_check_mark: ${user.handle} [0원] ${challenge ? '!' : ''}\n `;
						}
					}
					const embed = new EmbedBuilder()
						.setColor(0xadff2f)
						.setTitle(`${start.toLocaleDateString('ko-KR')} ~ ${end.toLocaleDateString('ko-KR')} 주간 정산`)
						.addFields([
							{
								name: `인원: ${fineCount}명, 합계: ${fineSum}원`,
								value: fines,
								inline: false
							}
						])
						.setTimestamp()
						.setFooter({
							text: '주간 정산',
							iconURL: 'https://cdn.discordapp.com/app-icons/1305799574774087691/f87824903ae00ab4727f050de7a59c8b.webp'
						});
					sendMessage({ embeds: [embed] });
				} catch (e) {
					console.log(e);
				}
			})
		];

		// 크론 시작
		for (const job of cronJobs) job.start();

		// 시작 로그
		this.container.logger.info(`[Cron] 총 ${cronJobs.length}개의 크론 작업을 시작했습니다.`);
	}
}

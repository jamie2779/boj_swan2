import type { ChatInputCommandDeniedPayload, Events } from '@sapphire/framework';
import { Listener, UserError } from '@sapphire/framework';

export class UserEvent extends Listener<typeof Events.ChatInputCommandDenied> {
	public override async run({ context, message }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		if (Reflect.get(Object(context), 'silent')) return;

		// ⏳ 쿨다운 메시지 한글로 커스터마이징
		let content = message;
		const remainingMs = Reflect.get(Object(context), 'remaining') as number | undefined;
		if (typeof remainingMs === 'number') {
			const seconds = (remainingMs / 1000).toFixed(0);
			content = `⏳ 아직 이 명령어를 사용할 수 없습니다. ${seconds}초 후에 다시 시도해주세요.`;
		}

		// 응답 처리
		if (interaction.deferred || interaction.replied) {
			return interaction.editReply({
				content,
				allowedMentions: { users: [interaction.user.id], roles: [] }
			});
		}

		return interaction.reply({
			content,
			allowedMentions: { users: [interaction.user.id], roles: [] },
			ephemeral: true
		});
	}
}

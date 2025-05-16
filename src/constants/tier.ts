export interface Tier {
	tier: string;
	rating: number;
	color: number;
	limit: number;
	challenge: number;
	emojiId?: string | null;
}

export const tierMapping: Tier[] = [
	{ tier: 'Unrated', rating: 0, color: 0x000000, limit: 1, challenge: 0, emojiId: '1372798580498239498' },
	{ tier: 'Bronze V', rating: 30, color: 0xad5600, limit: 1, challenge: 1, emojiId: '1372623867947909175' },
	{ tier: 'Bronze IV', rating: 60, color: 0xb85b00, limit: 2, challenge: 1, emojiId: '1372623870439325878' },
	{ tier: 'Bronze III', rating: 90, color: 0xc46100, limit: 3, challenge: 1, emojiId: '1372623873157107843' },
	{ tier: 'Bronze II', rating: 120, color: 0xcf6700, limit: 4, challenge: 1, emojiId: '1372623875028025505' },
	{ tier: 'Bronze I', rating: 150, color: 0xdb6c00, limit: 4, challenge: 2, emojiId: '1372623878354108567' },
	{ tier: 'Silver V', rating: 200, color: 0x435f7a, limit: 4, challenge: 2, emojiId: '1372623880128168046' },
	{ tier: 'Silver IV', rating: 300, color: 0x476582, limit: 5, challenge: 2, emojiId: '1372623881910616134' },
	{ tier: 'Silver III', rating: 400, color: 0x4b6b8a, limit: 5, challenge: 2, emojiId: '1372623884062425098' },
	{ tier: 'Silver II', rating: 500, color: 0x507292, limit: 5, challenge: 2, emojiId: '1372623885786419270' },
	{ tier: 'Silver I', rating: 650, color: 0x54789a, limit: 6, challenge: 3, emojiId: '1372623887438712975' },
	{ tier: 'Gold V', rating: 800, color: 0xec9a00, limit: 7, challenge: 3, emojiId: '1372623890404216886' },
	{ tier: 'Gold IV', rating: 950, color: 0xfba400, limit: 8, challenge: 3, emojiId: '1372623892140654655' },
	{ tier: 'Gold III', rating: 1100, color: 0xffae00, limit: 8, challenge: 3, emojiId: '1372623894137012356' },
	{ tier: 'Gold II', rating: 1250, color: 0xffb800, limit: 9, challenge: 4, emojiId: '1372623896255397959' },
	{ tier: 'Gold I', rating: 1400, color: 0xffc300, limit: 9, challenge: 4, emojiId: '1372623992476663908' },
	{ tier: 'Platinum V', rating: 1600, color: 0x25d69b, limit: 10, challenge: 4, emojiId: '1372623901531701338' },
	{ tier: 'Platinum IV', rating: 1750, color: 0x27e2a4, limit: 10, challenge: 4, emojiId: '1372623904555794597' },
	{ tier: 'Platinum III', rating: 1900, color: 0x28edac, limit: 11, challenge: 4, emojiId: '1372623908515348651' },
	{ tier: 'Platinum II', rating: 2000, color: 0x2af8b4, limit: 11, challenge: 4, emojiId: '1372623912118259845' },
	{ tier: 'Platinum I', rating: 2100, color: 0x2cffbc, limit: 11, challenge: 4, emojiId: '1372623922775724103' },
	{ tier: 'Diamond V', rating: 2200, color: 0x00b4fc, limit: 11, challenge: 4, emojiId: '1372623925200289872' },
	{ tier: 'Diamond IV', rating: 2300, color: 0x00c0ff, limit: 11, challenge: 4, emojiId: '1372623927440048149' },
	{ tier: 'Diamond III', rating: 2400, color: 0x00ccff, limit: 11, challenge: 4, emojiId: '1372623929339936870' },
	{ tier: 'Diamond II', rating: 2500, color: 0x00d8ff, limit: 11, challenge: 4, emojiId: '1372623931768574084' },
	{ tier: 'Diamond I', rating: 2600, color: 0x00e4ff, limit: 11, challenge: 4, emojiId: '1372623933760737361' },
	{ tier: 'Ruby V', rating: 2700, color: 0xcc004e, limit: 11, challenge: 4, emojiId: '1372623935853563934' },
	{ tier: 'Ruby IV', rating: 2800, color: 0xdd0054, limit: 11, challenge: 4, emojiId: '1372623994750238831' },
	{ tier: 'Ruby III', rating: 2850, color: 0xee005b, limit: 11, challenge: 4, emojiId: '1372623940035416244' },
	{ tier: 'Ruby II', rating: 2900, color: 0xff0062, limit: 11, challenge: 4, emojiId: '1372623941427789856' },
	{ tier: 'Ruby I', rating: 2950, color: 0xff0068, limit: 11, challenge: 4, emojiId: '1372623996721430618' },
	{ tier: 'Master', rating: 3000, color: 0xba90fa, limit: 11, challenge: 4, emojiId: null }
];

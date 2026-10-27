import { tierBlocks, CLOSING, DEFAULT_TRAIT, DEFAULT_RELATION } from "./presets.js";

const VAR = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

const LANG_NAME = { zh: "简体中文", en: "English", ja: "日本語" };

const ENVELOPE_HEAD = /^\s*<\|im_start\|>system:\s*/i;
const ENVELOPE_PROJ = /^\s*<project_instructions>\s*/i;
const ENVELOPE_TAIL = /<\/project_instructions>\s*$/i;

/** 把 {{var}} 全部换成值；未知变量原样保留，方便用户自查。 */
export function interpolate(text, vars) {
	return String(text || "").replace(VAR, (whole, key) => {
		const value = vars[key];
		return value === undefined || value === null ? whole : String(value);
	});
}

/** 剥掉 chatml 外壳，避免二次包裹。 */
export function stripEnvelope(text) {
	let out = String(text || "");
	out = out.replace(ENVELOPE_HEAD, "").replace(ENVELOPE_PROJ, "");
	out = out.replace(ENVELOPE_TAIL, "");
	return out.trim();
}

export function buildVars(state, extra = {}) {
	const lang = state.lang || "zh";
	return {
		persona: state.persona || "小码酱",
		user: extra.user || "他",
		lang: LANG_NAME[lang] || lang,
		trait: extra.trait || DEFAULT_TRAIT,
		relation: extra.relation || DEFAULT_RELATION,
		model: extra.model || "",
		date: new Date().toISOString().slice(0, 10),
	};
}

/**
 * 组装最终注入文本。永不抛错：任何异常都退回一段最小可用文本。
 * @returns {{ text: string, chars: number, tier: string, ok: boolean, error?: string }}
 */
export function compose(state, extra = {}) {
	try {
		const vars = buildVars(state, extra);
		const tier = state.tier || "standard";
		let body;
		if (tier === "custom") {
			body = stripEnvelope(state.custom || "");
		} else {
			body = tierBlocks(tier)
				.map((block) => interpolate(block, vars))
				.join("\n\n");
			if (!ENVELOPE_TAIL.test(body)) body = body + "\n" + CLOSING;
		}
		const text = body.trim();
		return { text, chars: text.length, tier, ok: text.length > 0 };
	} catch (error) {
		const fallback = "**PRIME DIRECTIVE**: 你就是 " + (state && state.persona ? state.persona : "小码酱") + "。直接回答，不加前言。";
		return { text: fallback, chars: fallback.length, tier: "fallback", ok: false, error: String(error && error.message ? error.message : error) };
	}
}

/** 给面板用的摘要：注入后前 240 字。 */
export function digest(text, max = 240) {
	const flat = String(text || "").replace(/\s+/g, " ").trim();
	return flat.length <= max ? flat : flat.slice(0, max) + "…";
}

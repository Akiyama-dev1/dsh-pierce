import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const SCHEMA = 1;
const MAX_CUSTOM = 200000;
const KEEP_BACKUPS = 5;

export const TIER_IDS = ["lite", "standard", "full", "custom"];

export const DEFAULTS = Object.freeze({
	schemaVersion: SCHEMA,
	enabled: true,
	tier: "full",
	persona: "小码酱",
	order: 10250,
	lang: "zh",
	custom: "",
	updatedAt: 0,
});

/**
 * 目录白名单：只接受落在用户家目录下的路径。
 *
 * 原因不是洁癖：本机实测 fs.mkdirSync('/proc/x', {recursive:true}) 会**无限期挂起**
 * （Android /proc + SELinux），同步 API 没有超时可用。一次坏路径就能把启动卡死，
 * 所以把「不在家目录下」的入参直接降级成默认路径，从源头掐掉这类挂死。
 */
/** 解析真实路径：不存在就逐级往上找第一个存在的祖先，再拼回来。 */
function realOf(target) {
	let cur = target;
	const tail = [];
	for (let i = 0; i < 12; i += 1) {
		try {
			const real = fs.realpathSync(cur);
			return path.join(real, ...tail.reverse());
		} catch (error) {
			const parent = path.dirname(cur);
			if (parent === cur) return target;
			tail.push(path.basename(cur));
			cur = parent;
		}
	}
	return target;
}

function under(child, root) {
	const a = realOf(path.resolve(child));
	const b = realOf(path.resolve(root));
	return a === b || a.startsWith(b + path.sep);
}

function baseDir(explicit) {
	const envHome = process.env.DSH_HOME || "";
	const home = os.homedir();
	const fallbackDir = envHome || path.join(home, ".dsh");
	const fallback = path.join(fallbackDir, "pierce");
	if (!explicit) return fallback;
	let resolved;
	try {
		resolved = path.resolve(String(explicit));
	} catch (error) {
		return fallback;
	}
	// /data/user/0 与 /data/data 是同一个物理目录，必须按真实路径比较，否则会误判成「目录外」
	const roots = [home, os.tmpdir(), fallbackDir];
	for (const r of roots) {
		if (under(resolved, r)) return resolved;
	}
	return fallback;
}

function clampOrder(value) {
	const n = Number(value);
	if (!Number.isFinite(n)) return DEFAULTS.order;
	return Math.min(20000, Math.max(-900, Math.round(n)));
}

function sanitize(raw, base) {
	const out = { ...base };
	if (!raw || typeof raw !== "object") return out;
	if (typeof raw.enabled === "boolean") out.enabled = raw.enabled;
	if (TIER_IDS.includes(raw.tier)) out.tier = raw.tier === "standard" ? "full" : raw.tier;
	if (typeof raw.persona === "string" && raw.persona.trim()) out.persona = raw.persona.slice(0, 40);
	if (typeof raw.lang === "string" && /^[a-z]{2}$/.test(raw.lang)) out.lang = raw.lang;
	if (typeof raw.custom === "string") out.custom = raw.custom.slice(0, MAX_CUSTOM);
	if (raw.order !== undefined) out.order = clampOrder(raw.order);
	if (Number.isFinite(raw.updatedAt)) out.updatedAt = raw.updatedAt;
	out.schemaVersion = SCHEMA;
	return out;
}

export function createStore(options = {}) {
	const dir = baseDir(options.dir);
	const file = path.join(dir, "store.json");
	let state = sanitize(null, DEFAULTS);
	const listeners = new Set();
	let broken = null;

	function emit() {
		for (const fn of listeners) {
			try {
				fn(state, file);
			} catch (error) {
				/* 单个订阅者出错不影响其它订阅者 */
			}
		}
	}

	function ensureDir() {
		try {
			fs.mkdirSync(dir, { recursive: true });
			return true;
		} catch (error) {
			broken = String(error && error.message ? error.message : error);
			return false;
		}
	}

	function load() {
		try {
			const text = fs.readFileSync(file, "utf8");
			state = sanitize(JSON.parse(text), DEFAULTS);
			broken = null;
		} catch (error) {
			if (error && error.code !== "ENOENT") broken = String(error.message || error);
			state = sanitize(null, DEFAULTS);
		}
		return state;
	}

	function backupRing() {
		try {
			if (!fs.existsSync(file)) return;
			const stamp = new Date().toISOString().replace(/[:.]/g, "-");
			fs.copyFileSync(file, path.join(dir, "store." + stamp + ".bak"));
			const list = fs
				.readdirSync(dir)
				.filter((n) => n.startsWith("store.") && n.endsWith(".bak"))
				.sort();
			while (list.length > KEEP_BACKUPS) {
				const victim = list.shift();
				try {
					fs.unlinkSync(path.join(dir, victim));
				} catch (error) {
					/* 忽略 */
				}
			}
		} catch (error) {
			/* 备份失败不阻断主流程 */
		}
	}

	function save() {
		if (!ensureDir()) return false;
		backupRing();
		const tmp = file + ".tmp-" + process.pid;
		try {
			fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
			fs.renameSync(tmp, file);
			broken = null;
			return true;
		} catch (error) {
			broken = String(error && error.message ? error.message : error);
			try {
				fs.unlinkSync(tmp);
			} catch (inner) {
				/* 忽略 */
			}
			return false;
		}
	}

	function get() {
		return state;
	}

	function set(patch) {
		state = sanitize({ ...state, ...patch, updatedAt: Date.now() }, DEFAULTS);
		const ok = save();
		emit();
		return { ok, state, error: broken };
	}

	function reset() {
		state = sanitize(null, { ...DEFAULTS, updatedAt: Date.now() });
		const ok = save();
		emit();
		return { ok, state, error: broken };
	}

	function subscribe(fn) {
		listeners.add(fn);
		return () => listeners.delete(fn);
	}

	function status() {
		return { dir, file, broken, exists: (() => {
			try {
				return fs.existsSync(file);
			} catch (error) {
				return false;
			}
		})() };
	}

	load();
	ensureDir();

	return { get, set, reset, subscribe, status, dir, file };
}

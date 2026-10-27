/**
 * dsh-pierce · 宿主侧
 *
 * 设计约束（每一条都对应一类真实崩溃）：
 * 1. inject 只声明 systemPrompt —— 往 inject 里塞可选服务会让 Cordis 空等，宿主直接起不来。
 * 2. 本体插入只写在 profile 层，自己的 bundle patch 里再 insert 会 already queued。
 * 3. apply 全程 try/catch，任何失败只记 lastError，不让启动链断掉。
 * 4. 段落注册带 disposer，重复 apply 先撤后挂，幂等。
 * 5. 状态写盘走原子 rename，带环形备份。
 */
import { createStore } from "./store.js";
import { compose, digest } from "./engine.js";
import { TIER_LIST } from "./presets.js";

export const name = "dsh-pierce";
export const inject = ["systemPrompt"];

const VERSION = "0.2.0";
const SECTION_NAME = "pierce:core";
const MAX_BODY = 512 * 1024;

function textOf(error) {
	return String(error && error.message ? error.message : error);
}

function json(response, code, payload) {
	try {
		const body = JSON.stringify(payload);
		response.writeHead(code, {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
			"content-length": Buffer.byteLength(body),
		});
		response.end(body);
	} catch (error) {
		try {
			response.destroy();
		} catch (inner) {
			/* 忽略 */
		}
	}
}

function readBody(request) {
	return new Promise((resolve) => {
		let size = 0;
		const chunks = [];
		const fail = () => {
			try {
				request.destroy();
			} catch (error) {
				/* 忽略 */
			}
			resolve(null);
		};
		request.on("data", (chunk) => {
			size += chunk.length;
			if (size > MAX_BODY) return fail();
			chunks.push(chunk);
		});
		request.on("error", () => resolve(null));
		request.on("end", () => {
			if (!chunks.length) return resolve({});
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch (error) {
				resolve(null);
			}
		});
	});
}

export function apply(ctx, config = {}) {
	const store = createStore({ dir: config && config.dir });
	const runtime = {
		version: VERSION,
		lastError: "",
		applied: { chars: 0, tier: "off", at: 0, ready: false },
		renders: 0,
		webRoutes: 0,
		clientHits: 0,
		startedAt: Date.now(),
	};
	let disposeSection = null;
	let stopped = false;

	const info = (message) => {
		try {
			ctx.logger?.info?.("[dsh-pierce] " + message);
		} catch (error) {
			/* 忽略 */
		}
	};

	function unregister() {
		if (!disposeSection) return;
		try {
			disposeSection();
		} catch (error) {
			runtime.lastError = "撤段落失败: " + textOf(error);
		}
		disposeSection = null;
	}

	function render() {
		unregister();
		if (stopped) return;
		runtime.renders += 1;
		const state = store.get();
		if (!state.enabled) {
			runtime.applied = { chars: 0, tier: "off", at: Date.now(), ready: false };
			return;
		}
		const out = compose(state);
		const prompt = ctx.systemPrompt;
		if (!prompt || typeof prompt.section !== "function") {
			runtime.lastError = "systemPrompt.section 不可用（服务未就绪）";
			runtime.applied = { chars: 0, tier: out.tier, at: Date.now(), ready: false };
			return;
		}
		try {
			disposeSection = prompt.section({ name: SECTION_NAME, order: state.order, text: out.text });
			runtime.applied = { chars: out.chars, tier: out.tier, at: Date.now(), ready: true };
			runtime.lastError = out.ok ? "" : out.error || "";
		} catch (error) {
			runtime.lastError = "注册段落失败: " + textOf(error);
			runtime.applied = { chars: 0, tier: out.tier, at: Date.now(), ready: false };
		}
	}

	/* ---------- 启动 ---------- */

	try {
		render();
		info("已挂载 · 注入 " + runtime.applied.chars + " 字符 · 档位 " + runtime.applied.tier);
	} catch (error) {
		runtime.lastError = "首次渲染失败: " + textOf(error);
	}

	let unsubscribe = () => {};
	try {
		unsubscribe = store.subscribe(() => {
			try {
				render();
			} catch (error) {
				runtime.lastError = "重载失败: " + textOf(error);
			}
		});
	} catch (error) {
		runtime.lastError = "订阅失败: " + textOf(error);
	}

	try {
		if (typeof ctx.effect === "function") {
			ctx.effect(() => () => {
				stopped = true;
				unregister();
				try {
					unsubscribe();
				} catch (error) {
					/* 忽略 */
				}
			}, "dsh-pierce: lifecycle");
		}
	} catch (error) {
		runtime.lastError = "生命周期注册失败: " + textOf(error);
	}

	/* ---------- 面板接口 ---------- */

	const snapshot = () => {
		const state = store.get();
		const out = compose({ ...state, enabled: true });
		return {
			ok: true,
			version: VERSION,
			enabled: state.enabled,
			tier: state.tier,
			persona: state.persona,
			order: state.order,
			lang: state.lang,
			custom: state.custom,
			updatedAt: state.updatedAt,
			tiers: TIER_LIST,
			applied: runtime.applied,
			lastError: runtime.lastError,
			renders: runtime.renders,
			clientHits: runtime.clientHits,
			store: store.status(),
			preview: digest(out.text, 320),
			chars: out.chars,
		};
	};

	function routes(host) {
		const webServer = host && host.webServer;
		if (!webServer || typeof webServer.register !== "function") {
			runtime.lastError = "webServer.register 不可用";
			return;
		}
		const disposers = [];
		const add = (spec, label) => {
			try {
				const d = webServer.register(spec, "dsh-pierce:" + label);
				if (typeof d === "function") disposers.push(d);
				runtime.webRoutes += 1;
			} catch (error) {
				runtime.lastError = "注册路由 " + label + " 失败: " + textOf(error);
			}
		};

		add(
			{
				kind: "exact",
				path: "/dsh-pierce/state",
				handler: async (request, response) => {
					if (request.method !== "GET") return json(response, 405, { ok: false, error: "GET only" });
					try {
						json(response, 200, snapshot());
					} catch (error) {
						json(response, 500, { ok: false, error: textOf(error) });
					}
				},
			},
			"state",
		);

		add(
			{
				kind: "exact",
				path: "/dsh-pierce/set",
				handler: async (request, response) => {
					if (request.method !== "POST") return json(response, 405, { ok: false, error: "POST only" });
					const body = await readBody(request);
					if (!body || typeof body !== "object") return json(response, 400, { ok: false, error: "bad json" });
					try {
						const patch = body.patch && typeof body.patch === "object" ? body.patch : body;
						const result = store.set(patch);
						json(response, result.ok ? 200 : 500, { ...snapshot(), ok: result.ok, saveError: result.error || "" });
					} catch (error) {
						json(response, 500, { ok: false, error: textOf(error) });
					}
				},
			},
			"set",
		);

		add(
			{
				kind: "exact",
				path: "/dsh-pierce/hello",
				handler: async (request, response) => {
					// 面板真的挂进 WebView 时会打这一枪：clientHits 由 0 变正数，就是 UI 活着的证据
					runtime.clientHits += 1;
					json(response, 200, { ok: true, hits: runtime.clientHits, version: VERSION });
				},
			},
			"hello",
		);

		add(
			{
				kind: "exact",
				path: "/dsh-pierce/preview",
				handler: async (request, response) => {
					const body = request.method === "POST" ? await readBody(request) : {};
					try {
						const state = { ...store.get(), ...(body && body.patch ? body.patch : body || {}) };
						const out = compose(state);
						json(response, 200, { ok: true, chars: out.chars, tier: out.tier, text: out.text.slice(0, 60000) });
					} catch (error) {
						json(response, 500, { ok: false, error: textOf(error) });
					}
				},
			},
			"preview",
		);

		add(
			{
				kind: "exact",
				path: "/dsh-pierce/reset",
				handler: async (request, response) => {
					if (request.method !== "POST") return json(response, 405, { ok: false, error: "POST only" });
					try {
						const result = store.reset();
						json(response, 200, { ...snapshot(), ok: result.ok });
					} catch (error) {
						json(response, 500, { ok: false, error: textOf(error) });
					}
				},
			},
			"reset",
		);

		try {
			if (typeof host.effect === "function") {
				host.effect(() => () => {
					for (const d of disposers) {
						try {
							d();
						} catch (error) {
							/* 忽略 */
						}
					}
				}, "dsh-pierce: routes");
			}
		} catch (error) {
			runtime.lastError = "路由生命周期失败: " + textOf(error);
		}
	}

	try {
		if (typeof ctx.inject === "function") {
			ctx.inject(["webServer"], (host) => {
				try {
					routes(host);
				} catch (error) {
					runtime.lastError = "面板接口挂载失败: " + textOf(error);
				}
			});
		} else {
			runtime.lastError = "ctx.inject 不可用（面板不可达）";
		}
	} catch (error) {
		runtime.lastError = "webServer 注入失败: " + textOf(error);
	}
}

export const __test = { SECTION_NAME, VERSION };

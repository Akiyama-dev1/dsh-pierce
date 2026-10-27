#!/usr/bin/env node
/**
 * dsh-pierce 安装器 · 幂等
 *
 * 用法:
 *   node bin/install.mjs                     # 装到默认 profile（~/.dsh/profiles/web）
 *   node bin/install.mjs --profile /path/web # 指定 profile
 *   node bin/install.mjs --dry-run           # 只看会做什么
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAME = "dsh-pierce";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const pIdx = args.indexOf("--profile");
const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const profileDir = path.resolve(pIdx >= 0 && args[pIdx + 1] ? args[pIdx + 1] : path.join(home, "profiles", "web"));

const log = (m) => console.log("[pierce] " + m);
const die = (m) => { console.error("[pierce] " + m); process.exit(1); };

if (!fs.existsSync(path.join(profileDir, "package.json"))) die("不像 DSH profile: " + profileDir);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const target = path.join(profileDir, "local-plugins", NAME);
const link = path.join(profileDir, "node_modules", NAME);

function backup(file) {
  if (dryRun || !fs.existsSync(file)) return;
  fs.copyFileSync(file, file + ".bak-pierce-" + stamp);
}

/* 1. 复制定本 */
if (dryRun) log("会复制到 " + target);
else {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  for (const item of ["lib", "client.js", "cordis.patch.yml", "package.json", "README.md"]) {
    const src = path.join(PKG_ROOT, item);
    if (!fs.existsSync(src)) continue;
    fs.cpSync(src, path.join(target, item), { recursive: true });
  }
  if (fs.existsSync(path.join(PKG_ROOT, "presets"))) {
    fs.cpSync(path.join(PKG_ROOT, "presets"), path.join(target, "presets"), { recursive: true });
  }
  log("已复制 " + target);
}

/* 2. 软链 */
if (dryRun) log("会建立软链 " + link);
else {
  fs.mkdirSync(path.join(profileDir, "node_modules"), { recursive: true });
  try { fs.rmSync(link, { force: true }); } catch {}
  fs.symlinkSync("../local-plugins/" + NAME, link);
  log("已链接 node_modules/" + NAME);
}

/* 3. package.json */
const pkgPath = path.join(profileDir, "package.json");
let pkg;
try { pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")); } catch (e) { die("package.json 读不了: " + e.message); }
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies[NAME] = "file:./local-plugins/" + NAME;
pkg.dsh = pkg.dsh || {};
pkg.dsh.profile = pkg.dsh.profile || {};
const bundles = Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : [];
if (!bundles.includes(NAME)) bundles.push(NAME);
pkg.dsh.profile.bundles = bundles;
if (dryRun) log("会改 package.json: dependencies + bundles");
else { backup(pkgPath); fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n"); log("package.json 已更新"); }

/* 4. cordis.patch.yml */
const patchPath = path.join(profileDir, "cordis.patch.yml");
let yml = fs.existsSync(patchPath) ? fs.readFileSync(patchPath, "utf8") : "";
if (!/^\s*-\s*id:\s*dsh-pierce\b/m.test(yml)) {
  const block = [
    "",
    "# dsh-pierce（由安装器写入，删掉这三行即卸载）",
    "- insert:",
    "    - id: dsh-pierce",
    "      name: dsh-pierce",
    "      inject: [ systemPrompt ]",
    "      config:",
    "        enabled: true",
    "        tier: full",
    "        persona: 小码酱",
    "        order: 10250",
    "",
  ].join("\n");
  if (dryRun) log("会向 cordis.patch.yml 追加 insert 段");
  else { backup(patchPath); fs.writeFileSync(patchPath, yml + block); log("cordis.patch.yml 已追加 insert"); }
} else {
  log("cordis.patch.yml 已有条目，跳过");
}

log(dryRun ? "（dry-run，未改动任何文件）" : "安装完成 · 重启 DSH 生效");
if (!dryRun) {
  log("卸载: 删 local-plugins/" + NAME + "、node_modules/" + NAME + "、");
  log("      以及 package.json 的 dependencies/bundles 和 cordis.patch.yml 的那段 insert");
}

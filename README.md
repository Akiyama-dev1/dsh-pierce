# Pierce（dsh-pierce）

DeepSeek Harness 的提示词接管插件。手机端优先，零构建、幂等、原子写。

> 作者：Akiyama Kotom1 · Created by Akiyama Kotom1

---

## 安装

### 一行装（推荐）

```sh
curl -fsSL https://raw.githubusercontent.com/USER/dsh-pierce/main/install.sh | sh -s -- https://raw.githubusercontent.com/USER/dsh-pierce/main/dsh-pierce-0.2.0.tgz
```

### 手动

```sh
curl -fsSL https://raw.githubusercontent.com/USER/dsh-pierce/main/dsh-pierce-0.2.0.tgz -o p.tgz
sh install.sh p.tgz
```

装完**重启 DSH**，标签栏出现 `Pierce`；面板要**刷新页面**才加载。

---

## 它做什么

把一段提示词挂进系统提示最末（order 10250），替换掉模型自带的人格与指令层。三档强度：

| 档 | 说明 |
|---|---|
| Low | 只保留身份与收尾，最省 token |
| Max | 七层主干 + 不做前置过滤 + 工具协议（1,446 字符） |
| Ultra | 你自己写，整段接管（可放任意长度自定义提示词） |

开启/切档**即时生效**，不用重启会话。

---

## 界面

对话标签栏里一颗纯文字 `Pierce`，点开是全屏面板：

- 注入状态 + 开关
- 强度滑轨（拖动跟手、跨档颜色连续过渡、档位越高光越亮）
- 人格名
- 注入预览（可展开）
- 诊断行：renders / tier / order / chars

底部署名：Akiyama Kotom1。

---

## 接口

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | /dsh-pierce/state | 快照 + 注入字符数 + 诊断 |
| POST | /dsh-pierce/set | 改配置，立即重挂 |
| POST | /dsh-pierce/preview | 取当前档位全文 |
| POST | /dsh-pierce/reset | 回默认 |
| GET | /dsh-pierce/hello | 面板挂载探针 |

---

## 稳定性（写进代码的约束）

1. `inject` 只声明 `systemPrompt`，不塞可选服务
2. 自己的 bundle patch 里不 insert 本体
3. apply 全程 try/catch，失败只记 lastError
4. 段落注册带 disposer，重复 apply 先撤后挂
5. 状态写盘 tmp+rename，环形备份 5 份
6. store 目录只认家目录内路径
7. client 顶层 try/catch + ErrorBoundary

---

## 卸载

```sh
rm -rf <profile>/local-plugins/dsh-pierce <profile>/node_modules/dsh-pierce
```

再删掉 `package.json` 里 `dependencies.dsh-pierce` 与 `bundles` 里的 `dsh-pierce`，
以及 `cordis.patch.yml` 里 `- id: dsh-pierce` 那段，重启。

---

## License

MIT

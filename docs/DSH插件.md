# DSH 插件（dsh-powerstrip）

PowerStrip 作为 DeepSeek Harness **永久插件**使用：注册两个工具，对话内直接调用，无需 shell。

## 安装（已完成）

```bash
cd dsh-package && pnpm pack --pack-destination ..
dsh plugin --profile web add D:/git/powerstrip/dsh-powerstrip-0.1.0.tgz
```

- 包名 `dsh-powerstrip`，bundle 行 `id: powerstrip`，已装入 `~/.dsh/profiles/web`（`--dump-config` 已验证）。
- **重启 DSH web 应用后生效**（当前进程内的动态插件 `pstrip-1` 提供同样的两个工具，重启后由永久插件接替）。

## 工具

| 工具 | 输入 | 说明 |
|---|---|---|
| `powerstrip_generate` | manifest（路径或内联 JSON）、outDir? | 运行生成器：53 插座 → Java + 资源 |
| `powerstrip_intent` | request、provider?(mock/api)、mode?(two-stage/single)、outDir? | 一句话 → 意图识别 → 生成 |

用法示例（对话内直接说）：

- "用 powerstrip_generate 生成 worldgen-full 到 D:/git/我的模组/src"
- "用 powerstrip_intent 做一个带GUI的抛光台和一个矿石探测器"
- "用 powerstrip_intent 做三个矿物，provider 用 api"（需 `POWERSTRIP_API_KEY`）

## 实现要点

- 插件是普通 Node ESM 模块（`lib/index.js`），经 `createRequire` **进程内 require** 生成器（`generate`/`runChain`），不依赖 shell、不受管道沙箱限制；
- 工具经 `@deepseek-ai/dsh-tools` 的 `defineTool` 注册到 `ctx.tools`，`ctx.effect` 持有注销器（随插件卸载清理）；
- 生成器根目录默认 `D:/git/powerstrip`，可用环境变量 `POWERSTRIP_ROOT` 覆盖；
- 返回值严格 lossless JSON（不含 `undefined` 字段），`output.render` 提供中文卡片摘要。

## 踩坑记录（dsh-plugin-development 技能验证）

1. `parameters.additionalProperties: false` 会被 defineTool 拒绝 → 省略；
2. `output.render` 必须是函数 → 提供摘要函数；
3. 本地安装必须 **tarball**（`pnpm pack` + `dsh plugin add <tgz>`），`add ./目录` 会变 link: 导致 peer 解析失败、`file:` 在 Windows 有盘符 bug；
4. `dsh plugin add` 写 `~/.dsh` → 沙箱需 `danger-full-access` 提权一次；
5. DSH 生态包放 `peerDependencies`（`@deepseek-ai/dsh-tools`），经 profile flat fallback 解析。

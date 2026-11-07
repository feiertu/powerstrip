# PowerStrip —— 排插式 Minecraft 模组代码生成器

[![CI](https://github.com/feiertu/powerstrip/actions/workflows/ci.yml/badge.svg)](https://github.com/feiertu/powerstrip/actions/workflows/ci.yml)

把"主观题"（自然语言需求）压成"选填题"（受 53 个插座目录约束的结构化清单），再像排插一样**确定性组装**出可在真实 Forge 1.20.1 环境编译的 Java 类与资源文件。

- 目标平台：Minecraft **1.20.1 Forge**（Forge 47.1.3 / ForgeGradle 6）
- 全部 8 份示例答卷已通过真实 MDK 编译验证（见 `docs/API核查报告.md`）
- 零运行时依赖，Node.js ≥ 18 即可运行

---

## 1. 环境要求

- Node.js ≥ 18（开发与测试在 Node 26 上验证过）
- Windows / macOS / Linux 均可（路径示例为 Windows）
- 可选：Minecraft 1.20.1 Forge MDK（仅编译验收需要；JDK 21 或 17）
- 可选：`POWERSTRIP_API_KEY`（意图层 api 模式；不设则默认离线 mock）

## 2. 安装步骤

```bash
git clone https://github.com/feiertu/powerstrip.git
cd powerstrip
# 无需 npm install（零运行时依赖）；需要跑 DSH 插件打包时才需要 pnpm
```

## 3. 技术栈与依赖

| 层 | 技术 |
|---|---|
| 语言/运行时 | JavaScript（CommonJS + ESM 混用），Node.js ≥ 18 |
| 模板引擎 | 自研极简模板（`{{}}`、`#if/#unless/#each/#else`，约 150 行，零依赖） |
| 意图层 LLM 接入 | OpenAI 兼容 API（默认 DeepSeek），可选离线 mock |
| 生成目标 | Java 17 字节码 + Minecraft Forge 1.20.1（net.minecraftforge API） |
| DSH 插件 | `@deepseek-ai/dsh-tools`（peerDependency，仅 dsh-package 使用） |
| 编译验证 | ForgeGradle 6 / Gradle 8.5 / JDK 21（`--release 17`） |

**运行时零 npm 依赖**（`package.json` 无 dependencies）；测试用 Node 内置 `assert`。

## 4. 项目结构

```
powerstrip/
├── generator.js               # 组装器入口（generate() / planManifest() 可编程调用）
├── lib/                       # render 模板引擎 / graph 依赖图 / guard 保护门 / assets+checks 资源层防错乱
├── sockets/catalog.json       # 53 插座 + 8 大类 + 31 hub 注册表（改这里即改生成器能力）
├── templates/                 # 90 个模板：shell 外壳 / hubs 汇聚中心 / sockets 插座 / assets 资源
├── intent/                    # 意图识别层：两段式 LLM 调用链（providers: mock/api）
├── examples/                  # 9 份选填题答卷（覆盖全部插座）
├── schema/                    # manifest JSON Schema
├── scripts/                   # 3 套测试 + verify-swap 编译验收交换脚本
├── dsh-package/               # DSH 永久插件包（powerstrip_generate / powerstrip_intent）
├── verify-mdk/skeleton/       # 1.20.1 编译验证工程配置（运行时目录不入库）
└── docs/                      # 边界分析 / API核查报告 / 意图识别层 / 资源层防错乱 / 能力层 / DSH插件
```

## 5. 贡献指南

1. 复刻仓库并新建分支（`git checkout -b feat/xxx`）；
2. 新插座 = `sockets/catalog.json` 条目 + `templates/` 模板 + 可选 hub/资源声明；
3. 提交前跑三套测试：`node scripts/capability-layer.test.js && node scripts/resource-layer.test.js && node scripts/intent-chain.test.js`；
4. 涉及生成代码 API 变更时，用 `verify-mdk/skeleton` 重建工程跑一次 `gradlew build`；
5. 提交信息用中文或英文动宾结构（如 `feat: 新增附魔插座`）。

## 6. 许可证

[MIT License](./LICENSE)，Copyright (c) 2026 feiertu。模板中的 API 形态参照了 MIT 许可的 Kaupenjoe 教程代码（见"引用与致谢"）。

## 7. 引用与致谢

- **Kaupenjoe 教程系列**（MIT）：50 种套路的 API 形态基准（`Forge-Tutorial-1.20.X` 1.20.1 线，本地参照 `D:\Forge-Tutorial-1.20.X-main`）；
- **MinecraftForge 官方 1.20.1 分支源码与官方文档**（docs.minecraftforge.net）：SimpleChannel、战利品修饰器等 API 核查依据；
- **TerraBlender / GeckoLib / JEI**：第三方依赖的接口形态；
- **用户提出的"排插模型"**：外壳（固定模板）/ 开关（参数档位）/ 插座（套路）/ 电源线（引用校验）/ 保护门（防护闸）的架构隐喻。

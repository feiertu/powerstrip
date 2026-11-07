# PowerStrip —— 排插式 Minecraft 模组代码生成器

[![CI](https://github.com/feiertu/powerstrip/actions/workflows/ci.yml/badge.svg)](https://github.com/feiertu/powerstrip/actions/workflows/ci.yml)

把"主观题"（自然语言需求）压成"选填题"（受 53 个插座目录约束的结构化清单），再像排插一样**确定性组装**出可在真实 Forge 1.20.1 环境编译的 Java 类与资源文件。

> 本项目是**代码生成工具**（DSL + 模板 + 意图识别流水线），不是机器学习模型；下述"模型说明"一节按项目实际形态调整为"生成器说明"。

- 目标平台：Minecraft **1.20.1 Forge**（Forge 47.1.3 / ForgeGradle 6）
- 全部 8 份示例答卷已通过真实 MDK 编译验证（见 `docs/API核查报告.md`）
- 零运行时依赖，Node.js ≥ 18 即可运行

---

## 1. 功能特性

- **50+ 套路、8 大类插座目录**：方块/物品/实体/世界生成/战利品/数据/兼容/能力层（网络包·能量·配置），53 个插座全部参数化（choice 选项、正则、范围、默认值）；
- **依赖图自动展开**：选一个"带 GUI 的方块"，自动带出方块注册、方块实体、Menu、Screen、渲染器、配方等一整串排插；
- **四层保护门**：版本约束（仅 1.20.1 Forge）、参数档位校验、跨插座"电源线"引用校验、命名冲突拦截；
- **资源层防错乱三道静态闸**：资源路径所有权表、客户端/服务端一致性核查、NBT 键对称核查；
- **意图识别层**：一句话需求 → 路由（7+1 类全覆盖判定）→ 并行填充 → 确定性合并/仲裁 → 校验重填 → 单次代码生成；默认离线 mock 关键词降级，api 模式走 OpenAI 兼容接口；
- **DSH 插件**：`dsh-powerstrip`（`powerstrip_generate` / `powerstrip_intent` 两个工具），可在 DeepSeek Harness 对话内直接调用。

## 2. 截图或演示

【截图占位】暂无产品截图。可运行的完整演示：

```bash
# 一句话生成一个机器模组（离线 mock 意图识别）
node intent/index.js "我想要一个带GUI的抛光台，还有能扫描矿石的金属探测器" --provider mock
```

输出示例（截断）：

```
[A1] 路由调用：7 类全覆盖判定（+终止）…
  选中：block-behavior（带GUI机器）、item-behavior（矿石探测器）、block-entity-gui（带GUI机器）
[A2] 并行填充：每个选中分类一次调用…
[D] 单次代码生成…
== PowerStrip 组装完成 ==
生成 20 个 Java 文件 + 12 个资源文件 → out-intent/
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

## 4. 环境要求

- Node.js ≥ 18（开发与测试在 Node 26 上验证过）
- Windows / macOS / Linux 均可（路径示例为 Windows）
- 可选：Minecraft 1.20.1 Forge MDK（仅编译验收需要；JDK 21 或 17）
- 可选：`POWERSTRIP_API_KEY`（意图层 api 模式；不设则默认离线 mock）

## 5. 安装步骤

```bash
git clone https://github.com/feiertu/powerstrip.git
cd powerstrip
# 无需 npm install（零运行时依赖）；需要跑 DSH 插件打包时才需要 pnpm
```

## 6. 配置说明

| 配置 | 位置 | 说明 |
|---|---|---|
| 插座目录 | `sockets/catalog.json` | 53 个插座、8 大类、31 个 hub 注册表、参数档位与派生规则（修改后生成器即时生效） |
| manifest 规范 | `schema/manifest.schema.json` | 选填题答卷的 JSON Schema（仅 1.20.1 + forge） |
| 意图层环境变量 | `POWERSTRIP_API_URL` / `POWERSTRIP_API_KEY` / `POWERSTRIP_MODEL` | 默认 `https://api.deepseek.com` / `deepseek-chat` |
| DSH 插件根目录 | `POWERSTRIP_ROOT` | 生成器根目录，默认 `D:/git/powerstrip` |
| 版本护栏 | `lib/guard.js` | 仅放行 `1.20.1` + `forge`（修改正则可扩展版本） |

## 7. 启动与使用示例

### 7.1 直接生成（manifest → 代码）

```bash
node generator.js examples/machine-capabilities.manifest.json
# 输出到 out/：17 个 Java + 7 个资源 + ASSEMBLY.md（含派生链与待核查标注）
```

全部 9 份示例答卷（覆盖全部 53 个插座）：

```bash
node generator.js examples/gem-polishing-station.manifest.json   # 垂直切片：GUI 机器 + 配方
node generator.js examples/registration-kitchen.manifest.json    # 物品/食物/工具/标签页/音效/村民
node generator.js examples/misc-blocks.manifest.json             # 作物/骰子方块/可燃柱
node generator.js examples/items-projectile.manifest.json        # 探测器/燃料/投掷物/盔甲/船
node generator.js examples/worldgen-full.manifest.json           # 矿物/树/群系/维度/传送门
node generator.js examples/loot-misc.manifest.json               # 告示牌/木种/战利品/数据生成/JEI
node generator.js examples/entity-rhino.manifest.json            # GeckoLib 实体全家桶
node generator.js examples/machine-capabilities.manifest.json    # 网络包/能量/配置
node generator.js examples/guard-demo-1.26.manifest.json         # 保护门演示（会被拦截）
```

### 7.2 意图识别（一句话 → 生成）

```bash
# 两段式（默认）：路由 + 并行填充
node intent/index.js "帮我做一颗松树和一片蓝宝石矿" --provider mock
# 单次调用模式
node intent/index.js "做一个传送门" --provider mock --mode single
# 真实 LLM（OpenAI 兼容）
POWERSTRIP_API_KEY=sk-xxx node intent/index.js "做三个矿物" --provider api
# 只识别不生成
node intent/index.js "做一个抛光台" --provider mock --no-gen
```

### 7.3 DSH 对话内使用

安装后（见 `docs/DSH插件.md`）直接说："用 powerstrip_intent 做一个带GUI的抛光台"。

## 8. 测试方法

```bash
npm test                # 三套测试：能力层 10 + 资源层 15 + 意图层 9（合计 34 项断言）
npm run test:syntax     # 全仓 JS 语法检查
npm run test:smoke      # 8 份示例答卷冒烟生成 + 保护门负例
```

全部无需网络（mock provider 驱动）、零依赖。CI（GitHub Actions）：push/PR 时在 ubuntu-latest / windows-latest × Node 18/20 矩阵上自动执行以上三步。

编译验收（可选，需 Forge MDK）：

```bash
# 按 verify-mdk/skeleton/README.md 重建验证工程后：
node scripts/verify-swap.js examples/worldgen-full.manifest.json verify-mdk
cd verify-mdk && gradlew build
```

## 9. 项目结构

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

## 10. 常见问题与故障排查

| 现象 | 原因 | 解决 |
|---|---|---|
| `保护门拦截：mcVersion ... 仅适用于 1.20.1 Forge` | manifest 的 mcVersion 或 loader 不合法 | 改为 `1.20.1` + `forge` |
| `依赖错误：插座 X 缺少实例且没有派生规则` | 选了行为插座但漏了它的前置根 | 按错误提示补显式选择（如自定义配方） |
| `资源路径冲突` | 两个插座实例生成同一资产路径 | 修改冲突方的 texturePath/modelPath 等参数 |
| `生成后静态核查失败`（side / NBT） | 模板被手工改出端侧引用或键漂移 | 对照报错行号修正模板 |
| gradle 构建失败 `Unsupported class file major version` | Gradle 版本与 JDK 不匹配 | 用 Gradle 8.5 + JDK 21（见 skeleton/README.md） |
| 意图层 api 模式报 `未设置 POWERSTRIP_API_KEY` | 环境变量缺失 | 设置 Key 或改用默认 mock |

## 11. 贡献指南

1. 复刻仓库并新建分支（`git checkout -b feat/xxx`）；
2. 新插座 = `sockets/catalog.json` 条目 + `templates/` 模板 + 可选 hub/资源声明；
3. 提交前跑三套测试：`node scripts/capability-layer.test.js && node scripts/resource-layer.test.js && node scripts/intent-chain.test.js`；
4. 涉及生成代码 API 变更时，用 `verify-mdk/skeleton` 重建工程跑一次 `gradlew build`；
5. 提交信息用中文或英文动宾结构（如 `feat: 新增附魔插座`）。

## 12. 许可证

[MIT License](./LICENSE)，Copyright (c) 2026 feiertu。模板中的 API 形态参照了 MIT 许可的 Kaupenjoe 教程代码（见"引用与致谢"）。

## 13. 引用与致谢

- **Kaupenjoe 教程系列**（MIT）：50 种套路的 API 形态基准（`Forge-Tutorial-1.20.X` 1.20.1 线，本地参照 `D:\Forge-Tutorial-1.20.X-main`）；
- **MinecraftForge 官方 1.20.1 分支源码与官方文档**（docs.minecraftforge.net）：SimpleChannel、战利品修饰器等 API 核查依据；
- **TerraBlender / GeckoLib / JEI**：第三方依赖的接口形态；
- **用户提出的"排插模型"**：外壳（固定模板）/ 开关（参数档位）/ 插座（套路）/ 电源线（引用校验）/ 保护门（防护闸）的架构隐喻。

## 14. 生成器说明（对应"模型说明"）

- **输入**：manifest 选填题答卷（7+1 大类 × 封闭插座选项 + 参数档位），或自然语言（经意图层转换）；
- **处理**：requires 闭包 + deriveFrom 按（规则×根实例）派生 → 保护门校验 → 模板渲染 → 资源生成 → 三道静态闸；
- **输出**：`src/main/java/**`、`src/main/resources/**`（assets/data/语言/音效/实体资源）与 `ASSEMBLY.md` 组装报告；
- **确定性**：同一 manifest 两次运行产物一致（可 diff 复现）；
- **已验证**：8 份示例答卷全部通过真实 Forge 1.20.1 MDK 编译（`docs/API核查报告.md`）。

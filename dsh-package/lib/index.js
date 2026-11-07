import { defineTool } from '@deepseek-ai/dsh-tools'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

// 生成器根目录：默认 D:/git/powerstrip，可经 POWERSTRIP_ROOT 环境变量覆盖
const ROOT = process.env.POWERSTRIP_ROOT || 'D:/git/powerstrip'

const { generate } = require(join(ROOT, 'generator.js'))
const { runChain } = require(join(ROOT, 'intent', 'index.js'))
const mockProvider = require(join(ROOT, 'intent', 'providers', 'mock.js'))
const apiProvider = require(join(ROOT, 'intent', 'providers', 'api.js'))

export const name = 'dsh-powerstrip'

export function apply(ctx) {
  const tools = ctx.get('tools')
  if (tools === undefined) return

  function writeInlineManifest(text) {
    const dir = join(ROOT, '.plugin-tmp')
    mkdirSync(dir, { recursive: true })
    const file = join(dir, 'manifest.json')
    writeFileSync(file, text, 'utf8')
    return file
  }

  const gen = defineTool({
    name: 'powerstrip_generate',
    description:
      '运行 PowerStrip 模组代码生成器（53 个插座、Minecraft 1.20.1 Forge）：传入 manifest 文件路径或内联 JSON（选填题答卷），确定性生成 Java 与资源文件。产物可并入 Forge MDK 编译（全部示例答卷已通过真实 1.20.1 编译验证）。',
    parameters: {
      type: 'object',
      properties: {
        manifest: {
          type: 'string',
          description: 'manifest 文件绝对路径，或内联 JSON 文本（以 { 开头按内联处理）',
        },
        outDir: {
          type: 'string',
          description: '输出目录（可选，默认 <POWERSTRIP_ROOT>/out-plugin）',
        },
      },
      required: ['manifest'],
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (r) => {
        if (!r || r.ok === false) return '❌ 生成失败：' + String((r && r.error) || '').slice(0, 300)
        return `✅ 生成完成：${r.files} 个 Java + ${r.assets} 个资源 → ${r.outDir}`
      },
    },
    execute: async (args) => {
      try {
        const text = String(args.manifest).trim()
        const manifestPath = text.startsWith('{') ? writeInlineManifest(text) : text
        const outDir = args.outDir || join(ROOT, 'out-plugin')
        const result = generate({ manifestPath, outDir, quiet: true })
        return {
          ok: true,
          files: result.written.length,
          assets: result.assetRelPaths.length,
          sockets: result.ordered.map((i) => ({ ref: i.ref, derived: i.derived === true })),
          manifestPath,
          outDir: result.outDir,
        }
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) }
      }
    },
  })

  const intent = defineTool({
    name: 'powerstrip_intent',
    description:
      'PowerStrip 意图识别层：把自然语言需求变成受约束的 manifest 答卷并生成代码（两段式 LLM 调用链）。默认使用离线 mock 关键词场景降级；api 模式需 POWERSTRIP_API_KEY。',
    parameters: {
      type: 'object',
      properties: {
        request: {
          type: 'string',
          description: '需求描述，如「做一个带GUI的抛光台和一个矿石探测器」',
        },
        provider: {
          type: 'string',
          enum: ['mock', 'api'],
          description: 'mock=离线关键词场景（默认）；api=OpenAI 兼容接口',
        },
        mode: {
          type: 'string',
          enum: ['two-stage', 'single'],
          description: 'two-stage=路由+并行填充（默认）；single=单次调用',
        },
        outDir: {
          type: 'string',
          description: '输出目录（可选，默认 <POWERSTRIP_ROOT>/out-intent-plugin）',
        },
      },
      required: ['request'],
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (r) => {
        if (!r || r.ok === false) return '❌ 意图生成失败：' + String((r && r.error) || '').slice(0, 300)
        return `✅ 识别并生成完成：${r.sockets} 个插座 → ${r.outDir}`
      },
    },
    execute: async (args) => {
      try {
        const provider = args.provider === 'api' ? apiProvider : mockProvider
        const outDir = args.outDir || join(ROOT, 'out-intent-plugin')
        const result = await runChain(String(args.request), {
          provider,
          mode: args.mode || 'two-stage',
          outDir,
          runGen: true,
          quiet: true,
        })
        return {
          ok: true,
          sockets: result.ordered.length,
          manifestPath: result.manifestPath,
          outDir: result.outDir,
          files: result.generation ? result.generation.written.length : 0,
        }
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) }
      }
    },
  })

  ctx.effect(() => tools.register(gen))
  ctx.effect(() => tools.register(intent))
}

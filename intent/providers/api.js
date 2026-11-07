'use strict';

// OpenAI 兼容 API provider（DeepSeek / OpenAI / Moonshot 等）。
// 环境变量：POWERSTRIP_API_URL（默认 https://api.deepseek.com）、POWERSTRIP_API_KEY、POWERSTRIP_MODEL（默认 deepseek-chat）。
// 与 mock provider 实现同一接口，全部返回解析好的对象；失败自动重试一次。

const { extractJson } = require('../json');
const prompts = require('../prompts');

function config() {
  const apiUrl = (process.env.POWERSTRIP_API_URL || 'https://api.deepseek.com').replace(/\/+$/, '');
  const apiKey = process.env.POWERSTRIP_API_KEY;
  const model = process.env.POWERSTRIP_MODEL || 'deepseek-chat';
  if (!apiKey) {
    throw new Error('未设置 POWERSTRIP_API_KEY。设置后即可使用 api provider；离线演示请用 --provider mock。');
  }
  return { apiUrl, apiKey, model };
}

async function complete(system, user) {
  const { apiUrl, apiKey, model } = config();
  let lastErr = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('响应中没有 choices[0].message.content');
      return extractJson(content);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`LLM 调用失败（已重试一次）：${lastErr.message}`);
}

const call = (p) => complete(p.system, p.user);

module.exports = {
  name: 'api',
  route: async (text, compact) => call(prompts.routePrompt(text, compact)),
  fill: async (text, categoryId, compactCat, opts) =>
    call(prompts.fillPrompt(text, compactCat, (opts && opts.error) || '')),
  arbitrate: async (text, conflict) => call(prompts.arbitratePrompt(text, conflict)),
  singleShot: async (text, compact) => call(prompts.singleShotPrompt(text, compact)),
};

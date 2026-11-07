'use strict';

// 从 LLM 输出中提取 JSON 对象（容忍代码围栏与前后杂文）

function extractJson(text) {
  const t = String(text).trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : t;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('模型输出中没有找到 JSON 对象');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

module.exports = { extractJson };

'use strict';

// API provider 的提示词模板（mock provider 不使用）
// 原则：socket 封闭枚举 + 参数档位全量给出 + "+终止"强制 7 类全覆盖表态 + 只输出 JSON

function systemBase() {
  return '你是 Minecraft 1.20.x Forge 模组代码生成器的意图识别模块。你只输出 JSON，不要输出任何解释、Markdown 或代码围栏。';
}

function routePrompt(requestText, compact) {
  const catList = compact.categories
    .map((c) => `- ${c.num}. ${c.name}（id=${c.id}）：${c.sockets.join('、')}`)
    .join('\n');
  return {
    system: systemBase() +
      '\n七大分类与可选套路（选项是封闭集合，禁止编造新插座）：\n' + catList,
    user: `用户需求："""${requestText}"""\n\n` +
      '任务：对 7 个分类逐一判定 state：用户明确提到该分类中的某种行为 → "selected"，未提到 → "terminated"。' +
      '每个分类都必须表态（这是防漏识别的强制检查）。' +
      'intents 数组只包含 state=selected 的分类，summary 用一句话概括，terms 列出需求原文中的关键名词。\n' +
      '输出 JSON：\n' +
      '{"decisions":[{"category":"registration","state":"selected","mentions":"关键名词"}],' +
      '"intents":[{"category":"block-behavior","summary":"...","terms":["..."]}]}',
  };
}

function fillPrompt(requestText, category, compactCat, errorText) {
  const socketList = compactCat.sockets.join('\n\n');
  return {
    system: systemBase() +
      `\n当前分类：${compactCat.num}. ${compactCat.name}（id=${compactCat.id}）\n` +
      '该分类下的插座与参数档位（choice 参数只能取选项内值；字符串参数须符合格式；必填必须给出）：\n' + socketList +
      '\n\n输出 JSON：\n{"selections":[{"ref":"<插座id>","params":{...}}]}\n' +
      '规则：只为用户提到或分类必需的插座输出 selections；注册类/派生类插座（如方块注册、物品注册、各类 hub）不要显式填写，生成器会自动带出；' +
      '参数只填与该插座行为相关的，其余留空由默认值处理。',
    user: `用户需求："""${requestText}"""\n` +
      (errorText
        ? `上一轮校验失败信息：${errorText}\n请根据错误修正本分类的选择与参数。`
        : '请为本分类输出 selections。'),
  };
}

function singleShotPrompt(requestText, compact) {
  return {
    system: systemBase() +
      '\n全部 50 个插座与参数档位：\n' + compact.all +
      '\n\n输出 JSON（完整 manifest 的 categories 部分，只包含有选择的分类）：\n' +
      '{"categories":[{"id":"<分类id>","selections":[{"ref":"<插座id>","params":{...}}]}]}',
    user: `用户需求："""${requestText}"""\n请直接输出完整 categories。`,
  };
}

function arbitratePrompt(requestText, conflict) {
  return {
    system: systemBase(),
    user: `用户需求："""${requestText}"""\n\n` +
      `检测到插座 ${conflict.ref} 出现注册名同为 "${conflict.key}" 但参数不同的两份选择：\n` +
      `A: ${JSON.stringify(conflict.a)}\n` +
      `B: ${JSON.stringify(conflict.b)}\n\n` +
      '请判断哪个更符合用户需求，输出 JSON：{"keep":"a"} 或 {"keep":"b"}。',
  };
}

module.exports = { routePrompt, fillPrompt, singleShotPrompt, arbitratePrompt };

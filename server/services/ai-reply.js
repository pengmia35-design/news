const { getDatabase } = require('../database')

async function generateAIReply(conversationMessages, userId) {
  const db = getDatabase()

  const aiEnabled = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_enabled'"
  ).get()
  if (!aiEnabled || aiEnabled.config_value !== '1') return null

  const endpoint = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_api_endpoint'"
  ).get()
  const apiKey = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_api_key'"
  ).get()
  const model = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_model'"
  ).get()

  if (!endpoint?.config_value || !apiKey?.config_value) return null

  const messages = [
    {
      role: 'system',
      content: '你是一个专业的客服助手，请简洁、友好、专业地回复用户问题。用户的问题类型可能涉及订阅扣费、充值支付、账号问题、工具使用等。如果问题超出你能力范围，请引导用户等待人工客服。回复控制在 200 字以内。'
    },
    ...conversationMessages.map(m => ({
      role: m.sender_type === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ]

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(endpoint.config_value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.config_value}`
      },
      body: JSON.stringify({
        model: model?.config_value || 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('AI API error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content
    return reply || null
  } catch (e) {
    console.error('AI reply generation failed:', e.message)
    return null
  }
}

async function generateSuggestions(conversationMessages) {
  const db = getDatabase()

  const aiEnabled = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_enabled'"
  ).get()
  if (!aiEnabled || aiEnabled.config_value !== '1') return []

  const endpoint = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_api_endpoint'"
  ).get()
  const apiKey = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_api_key'"
  ).get()
  const model = db.prepare(
    "SELECT config_value FROM system_config WHERE config_key = 'ai_model'"
  ).get()

  if (!endpoint?.config_value || !apiKey?.config_value) return []

  const history = conversationMessages.map(m => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.content
  }))

  const messages = [
    {
      role: 'system',
      content: `你是一个专业的客服助手。根据对话历史，生成3条简洁、友好、专业的建议回复。
每条回复控制在100字以内。以 JSON 数组格式返回，如：["回复1", "回复2", "回复3"]。
只返回 JSON 数组，不要其他内容。`
    },
    ...history,
    { role: 'user', content: '请根据以上对话，生成3条建议回复。' }
  ]

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const res = await fetch(endpoint.config_value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.config_value}`
      },
      body: JSON.stringify({
        model: model?.config_value || 'gpt-4o-mini',
        messages,
        max_tokens: 600,
        temperature: 0.8
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('AI suggest error:', res.status, await res.text())
      return []
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''
    const jsonMatch = text.match(/\[[\s\S]*?\]/)
    if (jsonMatch) {
      const arr = JSON.parse(jsonMatch[0])
      if (Array.isArray(arr)) return arr.slice(0, 3)
    }
    return []
  } catch (e) {
    console.error('AI suggestions failed:', e.message)
    return []
  }
}

module.exports = { generateAIReply, generateSuggestions }

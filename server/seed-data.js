// ========================================
// 生成 25 条虚拟科技新闻素材
// 5个分类 × 5条 = 25条
// ========================================

const path = require('path')
const { initDatabase, getDatabase } = require('./database')

const CATEGORIES = [
  { id: 1, name: 'AI行业资讯', slug: 'ai-news' },
  { id: 2, name: '算力&云服务', slug: 'cloud-computing' },
  { id: 3, name: '芯片&英伟达', slug: 'nvidia-chip' },
  { id: 4, name: '开发工具', slug: 'dev-tools' },
  { id: 5, name: '前沿科技动态', slug: 'tech-trends' },
]

const ARTICLES = {
  'ai-news': [
    { title: 'DeepSeek-R1 开源模型下载量突破千万大关', summary: '深度求索旗下开源大模型 DeepSeek-R1 自发布以来全球下载量突破 1000 万次，成为开源社区最受欢迎的大语言模型之一。', content: '深度求索公司今日宣布，其开源大模型 DeepSeek-R1 自正式发布以来，全球累计下载量已突破 1000 万次。这一里程碑标志着中国开源大模型在全球范围内的影响力持续扩大。', tags: ['DeepSeek', '大模型', '开源'] },
    { title: 'MiniMax 发布新一代多模态大模型，支持实时视频理解', summary: 'MiniMax 推出全新多模态大模型，突破性支持实时视频流理解和语音交互，开启端到端多模态对话新范式。', content: '人工智能初创公司 MiniMax 今日正式发布其新一代多模态大模型，该模型首次实现了对实时视频流的端到端理解和自然语言交互。技术团队现场演示了模型对视频内容的实时分析能力，响应延迟控制在 200 毫秒以内。', tags: ['MiniMax', '多模态', 'AI'] },
    { title: '通义千问 2.5 版本升级，推理能力提升40%', summary: '阿里云发布通义千问 2.5 版本，在复杂推理和代码理解上实现重大升级，推理效率提升 40%。', content: '阿里云今日正式发布通义千问 2.5 版本，在数学推理、逻辑分析和代码理解等任务上取得了显著进步，推理效率相比上一代提升 40%。在权威的中文大模型评测榜单上，多项指标已接近 GPT-4 水平。', tags: ['通义千问', '阿里云', '大模型'] },
    { title: '百度文心一言企业用户突破 500 万', summary: '百度文心一言企业级 API 调用用户数已突破 500 万，日均处理请求超 30 亿次。', content: '在近日举办的百度 AI 开发者大会上，百度官方公布了文心一言最新运营数据。截至 5 月初，企业级 API 注册用户数已突破 500 万，日均 API 调用量超过 30 亿次。', tags: ['百度', '文心一言', '企业服务'] },
    { title: '月之暗面 Kimi 推出超长上下文窗口达 200 万字', summary: '月之暗面科技宣布 Kimi 对话模型上下文窗口扩展至 200 万字，支持一次性处理超长文档。', content: '月之暗面科技今日宣布，旗下 Kimi 对话模型正式将上下文窗口扩展至 200 万字，这意味着模型可以一次性处理整部《三体》三部曲级别的文本量。', tags: ['月之暗面', 'Kimi', '长文本'] },
  ],
  'cloud-computing': [
    { title: '阿里云推出新一代弹性算力实例，性能提升 50%', summary: '阿里云发布全新 ECS 弹性计算实例，单实例算力提升 50%，网络延迟降低 30%。', content: '阿里云今日发布新一代弹性计算实例 ECS G7 系列，单实例算力较上一代提升 50%，网络延迟降低 30%。在 AI 推理、科学计算和高性能数据库场景下表现尤为出色。', tags: ['阿里云', '弹性计算', '算力'] },
    { title: '腾讯云发布 AI 推理专用集群，延迟低至 5ms', summary: '腾讯云推出全新 AI 推理优化集群，端到端推理延迟最低降至 5 毫秒，专为实时 AI 应用设计。', content: '腾讯云今日发布了专用的 AI 推理集群产品 TI-Accelerator，将端到端推理延迟压缩到了 5 毫秒级别。专为自动驾驶、实时翻译和金融风控等场景设计。', tags: ['腾讯云', 'AI推理', '云服务'] },
    { title: '华为云推出昇腾云服务，国产算力生态加速成熟', summary: '华为云基于昇腾 910B 芯片推出全新云算力服务，已适配 200+ 主流大模型。', content: '华为云今日推出基于昇腾 910B 处理器的全新 AI 云算力服务，单卡 FP16 算力达到 320 TFLOPS，已完成超过 200 个主流大模型的适配优化。', tags: ['华为云', '昇腾', '国产算力'] },
    { title: '火山引擎推出按需算力市场，盘活闲置 GPU 资源', summary: '火山引擎上线 GPU 算力共享市场，企业可将闲置算力资源挂牌出租。', content: '火山引擎今日正式上线 GPU 算力共享市场，企业可将闲置 GPU 算力资源挂牌出租，AI 创业公司和科研机构可低成本租用所需算力。', tags: ['火山引擎', 'GPU算力', '云服务'] },
    { title: '移动算力 Token 市场崛起，边缘推理成新蓝海', summary: '移动端 AI 推理催生算力 Token 新经济，按 Token 计费的边缘推理服务正成为新增长极。', content: '随着端侧 AI 爆发，移动算力 Token 市场正在快速崛起。运营商联合云厂商推出"按 Token 计费"模式，让开发者更灵活地控制推理成本。', tags: ['移动算力', '边缘计算', 'Token'] },
  ],
  'nvidia-chip': [
    { title: '英伟达 Blackwell 芯片量产提速，Q2 出货量翻倍', summary: '英伟达 Blackwell 架构芯片进入加速量产阶段，Q2 出货量预计环比增长超过 100%。', content: '英伟达 CFO 在摩根大通科技会议上透露，Blackwell 架构芯片已进入加速量产阶段，Q2 出货量预计将实现环比翻倍增长。', tags: ['英伟达', 'Blackwell', 'GPU'] },
    { title: 'AMD Instinct MI400 发布，AI 算力达 2.3 PFLOPS', summary: 'AMD 发布 Instinct MI400 加速卡，FP8 算力达到 2.3 PFLOPS，配备 288GB HBM3E 高带宽显存。', content: 'AMD 正式发布 Instinct MI400 数据中心加速卡，采用先进封装工艺集成多个计算芯粒，FP8 算力高达 2.3 PFLOPS。', tags: ['AMD', 'Instinct', 'AI算力'] },
    { title: '昇腾 920 流片成功，国产 AI 芯片迈入新阶段', summary: '华为昇腾 920 芯片已成功流片，采用先进制程工艺，AI 算力较上代提升 2 倍以上。', content: '华为旗下昇腾 920 AI 芯片已成功完成流片。该芯片采用更先进的制程工艺，AI 算力较昇腾 910B 提升 2 倍以上。', tags: ['华为', '昇腾', '国产芯片'] },
    { title: 'HBM4 标准正式发布，高带宽内存进入新世代', summary: 'JEDEC 正式发布 HBM4 内存标准，单个堆叠容量最高可达 64GB，带宽突破 2 TB/s。', content: 'JEDEC 固态技术协会正式发布了 HBM4 内存标准规范。新标准单个堆叠容量最高可达 64GB，数据传输带宽突破 2 TB/s。', tags: ['HBM4', '内存', 'AI芯片'] },
    { title: '中国芯片自给率提升至 25%，成熟制程产能扩张', summary: '中国芯片自给率在 2026 年 Q1 达到 25%，成熟制程产能持续扩张，国产替代进程稳步推进。', content: '行业报告显示，2026 年第一季度中国芯片自给率已达到 25%，较 2020 年的 15% 提升了 10 个百分点。成熟制程产能持续扩张。', tags: ['芯片', '国产替代', '半导体'] },
  ],
  'dev-tools': [
    { title: 'Cursor 发布 AI 编程新功能，支持全项目代码重构', summary: 'Cursor 编辑器推出全新 AI 驱动代码重构功能，可一次性分析和修改整个代码库的结构。', content: 'AI 编程编辑器 Cursor 发布重磅更新，新增全项目级别代码重构能力。开发者只需用自然语言描述重构目标，AI 即可自动完成分析、修改和测试。', tags: ['Cursor', 'AI编程', '重构'] },
    { title: 'Claude Code 正式上线，AI 编程进入终端时代', summary: 'Anthropic 发布 Claude Code，将 AI 编程能力直接带入终端命令行环境。', content: 'Anthropic 正式发布了 Claude Code 工具，将 AI 编程助手的能力直接带入终端环境。开发者可以在命令行中直接与 AI 协作完成编码任务。', tags: ['Claude Code', 'AI编程', 'Anthropic'] },
    { title: 'GitHub Copilot 升级，支持多文件智能编辑', summary: 'GitHub Copilot 迎来重大更新，新增多文件同时编辑和项目级上下文理解能力。', content: 'GitHub 宣布 Copilot 完成重大升级，新增多文件同时编辑能力。AI 现在可以同时理解和修改项目中的多个关联文件。', tags: ['GitHub', 'Copilot', 'AI编程'] },
    { title: 'Vite 6 发布，构建速度再提升 3 倍', summary: '前端构建工具 Vite 发布 6.0 版本，采用全新 Rust 编写的模块打包器，构建速度提升 3 倍。', content: '前端构建工具 Vite 正式发布 6.0 版本，核心打包模块用 Rust 重写，开发服务器启动和热更新速度显著提升。', tags: ['Vite', '前端工具', '构建工具'] },
    { title: '开源 AI 代码审查工具逐步成熟，团队协作效率提升', summary: '基于 AI 的开源代码审查工具在开发者社区中快速普及，自动化审查覆盖率和准确率持续提升。', content: '越来越多的开发团队开始采用 AI 代码审查工具来提升代码质量和审查效率。这类工具能够自动发现潜在的 bug 和安全漏洞。', tags: ['代码审查', 'AI工具', '开源'] },
  ],
  'tech-trends': [
    { title: '具身智能迎来突破，大模型赋能机器人', summary: '将大语言模型与机器人硬件结合成为新风口，具身智能机器人在自主决策方面取得显著进展。', content: '具身智能正在成为 AI 领域最受关注的前沿方向。特斯拉、Figure AI 等公司相继展示了大模型驱动的智能机器人原型产品。', tags: ['具身智能', '机器人', '前沿'] },
    { title: 'AI 安全治理成全球焦点，多国推进立法进程', summary: '随着大模型应用规模扩大，AI 安全治理成为跨国议题，多国加快推进 AI 监管立法。', content: '全球 AI 安全治理进入实质性推进阶段。欧盟 AI 法案已进入执行阶段，中国和美国也在加速推进 AI 监管框架。', tags: ['AI安全', '政策法规', '监管'] },
    { title: '量子计算取得新突破，纠错能力大幅提升', summary: '多家研究机构在量子纠错领域取得重要进展，距离实用化量子计算机更近一步。', content: '近期多个研究团队在量子纠错技术上取得突破性进展。Google Quantum AI 团队实现了更低逻辑错误率的表面码纠错。', tags: ['量子计算', '前沿科技', '科研'] },
    { title: '6G 研发加速推进，预计 2028 年商用部署', summary: '全球 6G 标准制定进入关键阶段，多国公布 6G 研发时间表，预计 2028 年启动商用部署。', content: 'ITU 和 3GPP 等国际标准组织正在加速推进 6G 标准化工作。多家运营商和设备商已经公布了 6G 研发路线图。', tags: ['6G', '通信', '前沿'] },
    { title: '脑机接口技术取得新进展，首次实现人类意念操控机器人', summary: '脑机接口技术实现里程碑式突破，志愿者通过意念成功操控机器人完成复杂操作任务。', content: '脑机接口技术近日取得了里程碑式的进展。Neuralink 和国内多家公司展示了意念控制机器人的最新成果。', tags: ['脑机接口', 'BCI', '前沿科技'] },
  ],
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w一-龥-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  await initDatabase()
  const db = getDatabase()

  const catMap = {}
  for (const cat of CATEGORIES) {
    catMap[cat.slug] = cat.id
  }

  let articleCount = 0

  for (const [slug, articles] of Object.entries(ARTICLES)) {
    const categoryId = catMap[slug]
    for (const article of articles) {
      const publishedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      const likes = Math.floor(Math.random() * 5000) + 100
      const comments = Math.floor(Math.random() * 300) + 10
      const result = db.prepare(`
        INSERT INTO articles (title, summary, content, category_id, status, is_featured, view_count, like_count, comment_count, published_at)
        VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, ?)
      `).run(article.title, article.summary, article.content, categoryId, 0, Math.floor(Math.random() * 500), likes, comments, publishedAt)
      const articleId = result.lastInsertRowid

      // 处理标签
      for (const tagName of article.tags) {
        const tagSlug = slugify(tagName)
        let tag = db.prepare('SELECT id FROM tags WHERE slug = ?').get(tagSlug)
        if (!tag) {
          const tagResult = db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)').run(tagName, tagSlug)
          tag = { id: tagResult.lastInsertRowid }
        }
        db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(articleId, tag.id)
      }
      articleCount++
    }
  }

  db.save()
  console.log(`  ✅ 成功生成 ${articleCount} 条虚拟文章数据`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ 生成数据失败:', err)
  process.exit(1)
})

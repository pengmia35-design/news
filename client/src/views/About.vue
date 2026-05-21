<template>
  <div class="page-container about-page">
    <div class="about-card">
      <h1 class="about-title">关于 TechAI 资讯</h1>

      <div class="about-content">
        <section class="about-section">
          <h2>关于本站</h2>
          <p>TechAI 资讯是一个专注科技与AI领域的极简资讯站点。我们致力于为技术从业者、AI开发者和科技爱好者提供高质量的行业新闻与深度内容。</p>
        </section>

        <section class="about-section">
          <h2>内容领域</h2>
          <ul class="about-list">
            <li><strong>AI行业资讯</strong> — 大模型、人工智能前沿动态</li>
            <li><strong>算力 &amp; 云服务</strong> — 算力市场、云服务套餐</li>
            <li><strong>芯片 &amp; 英伟达</strong> — GPU、芯片行业趋势</li>
            <li><strong>开发工具</strong> — Cursor、Claude Code、GitHub 等</li>
            <li><strong>前沿科技动态</strong> — 编程开发、技术趋势</li>
          </ul>
        </section>

        <section class="about-section">
          <h2>技术栈</h2>
          <div class="tech-stack">
            <span class="tech-badge">Vue 3</span>
            <span class="tech-badge">Element Plus</span>
            <span class="tech-badge">Tailwind CSS</span>
            <span class="tech-badge">Node.js</span>
            <span class="tech-badge">Express</span>
            <span class="tech-badge">SQLite</span>
          </div>
        </section>

        <section class="about-section admin-entry">
          <h2>后台管理</h2>
          <p>管理员可通过以下入口登录后台管理系统，管理轮播图、分类和文章内容。</p>
          <router-link to="/admin" class="admin-btn">
            <span class="admin-btn-icon">⚙️</span>
            进入后台管理系统
          </router-link>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  max-width: 800px;
}

.about-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: 48px;
}

.about-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-foreground);
  margin: 0 0 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-primary);
}

.about-section {
  margin-bottom: 28px;
}

.about-section h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-foreground);
  margin: 0 0 12px;
}

.about-section p {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-muted-foreground);
  margin: 0;
}

.about-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.about-list li {
  padding: 8px 0;
  font-size: 15px;
  color: var(--color-muted-foreground);
  line-height: 1.6;
}

.about-list li::before {
  content: '•';
  color: var(--color-primary);
  font-weight: bold;
  margin-right: 8px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tech-badge {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--color-accent);
  color: var(--color-primary);
  border-radius: var(--radius-full);
}

.admin-entry {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid var(--color-border);
}

.admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

.admin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
}

.admin-btn-icon {
  font-size: 18px;
}

@media (max-width: 768px) {
  .about-card { padding: 24px; }
  .about-title { font-size: 22px; }
}
</style>

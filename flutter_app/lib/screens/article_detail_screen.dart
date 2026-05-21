import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/article.dart';
import '../models/comment.dart';
import '../services/api_service.dart';

class ArticleDetailScreen extends StatefulWidget {
  final int articleId;

  const ArticleDetailScreen({super.key, required this.articleId});

  @override
  State<ArticleDetailScreen> createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends State<ArticleDetailScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _nicknameController = TextEditingController();
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  Article? _article;
  List<Comment> _comments = [];
  int _commentTotal = 0;
  int _commentPage = 1;
  int _likeCount = 0;
  bool _articleLoading = true;
  bool _commentLoading = false;
  bool _submitting = false;
  bool _liked = false;

  @override
  void initState() {
    super.initState();
    _loadArticle();
    _loadComments();
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    _commentController.dispose();
    _scrollController.dispose();
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadArticle() async {
    setState(() => _articleLoading = true);
    try {
      final article = await _api.getArticle(widget.articleId);
      if (!mounted) return;
      setState(() {
        _article = article;
        _likeCount = article?.likeCount ?? 0;
        _articleLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _articleLoading = false);
    }
  }

  Future<void> _loadComments() async {
    setState(() => _commentLoading = true);
    try {
      final res = await _api.getComments(widget.articleId, page: _commentPage);
      if (!mounted) return;
      setState(() {
        _comments = _commentPage == 1 ? res.list : [..._comments, ...res.list];
        _commentTotal = res.total;
        _commentLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _commentLoading = false);
    }
  }

  Future<void> _like() async {
    if (_liked) return;
    try {
      final count = await _api.likeArticle(widget.articleId);
      if (!mounted) return;
      setState(() {
        _liked = true;
        _likeCount = count;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('点赞成功！'), duration: Duration(seconds: 1)),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('点赞失败'), duration: Duration(seconds: 1)),
        );
      }
    }
  }

  Future<void> _submitComment() async {
    final nickname = _nicknameController.text.trim();
    final content = _commentController.text.trim();
    if (nickname.isEmpty || content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请填写昵称和评论内容')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final ok = await _api.postComment(widget.articleId, nickname, content);
      if (!mounted) return;
      if (ok) {
        _commentController.clear();
        _commentPage = 1;
        await _loadComments();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('评论发表成功！'), duration: Duration(seconds: 2)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('评论失败，请重试')),
        );
      }
    }
    if (mounted) setState(() => _submitting = false);
  }

  void _share() {
    final url = 'http://10.0.2.2:3001/articles/${widget.articleId}';
    SharePlus.instance.share(
      ShareParams(
        text: '${_article?.title ?? ''}\n$url',
      ),
    );
  }

  void _shareWeibo() {
    final text = '${_article?.title ?? ''} - TechAI 资讯';
    _launchUrl(
      'https://service.weibo.com/share/share.php?title=${Uri.encodeComponent(text)}&url=${Uri.encodeComponent('http://10.0.2.2:3001/articles/${widget.articleId}')}',
    );
  }

  void _shareQQ() {
    final text = '${_article?.title ?? ''} - TechAI 资讯';
    _launchUrl(
      'https://connect.qq.com/widget/shareqq/index.html?title=${Uri.encodeComponent(text)}&url=${Uri.encodeComponent('http://10.0.2.2:3001/articles/${widget.articleId}')}',
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(_article?.categoryName ?? '文章详情'),
        actions: [
          IconButton(icon: const Icon(Icons.share), onPressed: _share),
        ],
      ),
      body: _articleLoading
          ? const Center(child: CircularProgressIndicator())
          : _article == null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.article_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4)),
                      const SizedBox(height: 16),
                      Text('文章不存在', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      FilledButton.tonal(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('返回'),
                      ),
                    ],
                  ),
                )
              : _buildBody(theme),
    );
  }

  Widget _buildBody(ThemeData theme) {
    final a = _article!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题
          Text(a.title, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, height: 1.3)),

          const SizedBox(height: 12),

          // 元信息
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(a.categoryName,
                    style: TextStyle(fontSize: 12, color: theme.colorScheme.onPrimaryContainer)),
              ),
              const SizedBox(width: 8),
              Icon(Icons.remove_red_eye_outlined, size: 14, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: 2),
              Text('${a.viewCount}', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(width: 12),
              Text(a.timeAgo, style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
            ],
          ),

          // 标签
          if (a.tags.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: a.tags.map((tag) => Chip(
                label: Text(tag.name, style: const TextStyle(fontSize: 11)),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 4),
              )).toList(),
            ),
          ],

          const SizedBox(height: 20),

          // 正文
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: MarkdownBody(
                data: a.content,
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: theme.textTheme.bodyLarge?.copyWith(height: 1.75),
                  h1: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                  h2: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  h3: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // 操作按钮组
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // 点赞
              _ActionButton(
                icon: _liked ? Icons.favorite : Icons.favorite_border,
                label: '点赞',
                count: _likeCount,
                color: _liked ? Colors.red : theme.colorScheme.onSurfaceVariant,
                activeColor: Colors.red,
                isActive: _liked,
                onTap: _like,
              ),
              const SizedBox(width: 16),
              // 分享到微博
              _ActionButton(
                icon: Icons.share,
                label: '微博',
                count: null,
                color: Colors.orange,
                onTap: _shareWeibo,
              ),
              const SizedBox(width: 16),
              // 分享到 QQ
              _ActionButton(
                icon: Icons.chat,
                label: 'QQ',
                count: null,
                color: Colors.blue,
                onTap: _shareQQ,
              ),
            ],
          ),

          const SizedBox(height: 24),

          // 评论区
          _buildCommentSection(theme),

          // 上一篇/下一篇
          if (a.prev != null || a.next != null) ...[
            const SizedBox(height: 16),
            const Divider(),
            if (a.prev != null)
              ListTile(
                leading: const Icon(Icons.arrow_back),
                title: const Text('上一篇', style: TextStyle(fontSize: 12)),
                subtitle: Text(a.prev!.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                onTap: () => Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => ArticleDetailScreen(articleId: a.prev!.id)),
                ),
              ),
            if (a.next != null)
              ListTile(
                trailing: const Icon(Icons.arrow_forward),
                title: const Text('下一篇', style: TextStyle(fontSize: 12)),
                subtitle: Text(a.next!.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                onTap: () => Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => ArticleDetailScreen(articleId: a.next!.id)),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildCommentSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('评论区', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(width: 8),
            Text('($_commentTotal)', style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
        const SizedBox(height: 12),

        // 评论表单
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  controller: _nicknameController,
                  decoration: const InputDecoration(
                    hintText: '输入昵称（必填）',
                    border: OutlineInputBorder(),
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  maxLength: 20,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _commentController,
                  decoration: const InputDecoration(
                    hintText: '写下你的想法...',
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  maxLines: 3,
                  maxLength: 1000,
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton(
                    onPressed: _submitting ? null : _submitComment,
                    child: Text(_submitting ? '提交中...' : '发表评论'),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // 评论列表
        if (_comments.isEmpty && !_commentLoading)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text('暂无评论，快来抢沙发吧~',
                  style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
            ),
          )
        else ...[
          ...List.generate(_comments.length, (index) {
            final c = _comments[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: theme.colorScheme.primary,
                    child: Text(
                      c.nickname.isNotEmpty ? c.nickname[0].toUpperCase() : '?',
                      style: TextStyle(color: theme.colorScheme.onPrimary, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(c.nickname,
                                style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                            const SizedBox(width: 8),
                            Text(c.timeAgo,
                                style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(c.content, style: theme.textTheme.bodyMedium?.copyWith(height: 1.4)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
          if (_comments.length < _commentTotal)
            Center(
              child: TextButton(
                onPressed: _commentLoading
                    ? null
                    : () {
                        _commentPage++;
                        _loadComments();
                      },
                child: Text(_commentLoading ? '加载中...' : '加载更多评论'),
              ),
            ),
        ],
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final int? count;
  final Color color;
  final Color? activeColor;
  final bool isActive;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    this.count,
    required this.color,
    this.activeColor,
    this.isActive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = isActive ? (activeColor ?? color) : color;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: c.withValues(alpha: 0.4)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: c),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: c, fontWeight: FontWeight.w500)),
            if (count != null) ...[
              const SizedBox(width: 4),
              Text('$count', style: TextStyle(color: c, fontWeight: FontWeight.w600)),
            ],
          ],
        ),
      ),
    );
  }
}

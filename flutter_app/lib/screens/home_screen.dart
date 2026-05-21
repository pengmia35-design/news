import 'package:flutter/material.dart';
import '../models/article.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../widgets/article_card.dart';
import '../widgets/category_chip.dart';
import 'article_detail_screen.dart';
import 'search_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  final ScrollController _scrollController = ScrollController();

  List<Article> _articles = [];
  List<Category> _categories = [];
  Category? _selectedCategory;
  int _page = 1;
  bool _loading = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.getCategories(),
        _api.getArticles(page: 1, pageSize: 20),
      ]);
      if (!mounted) return;
      setState(() {
        _categories = results[0] as List<Category>;
        final articleRes = results[1] as ArticleListResponse;
        _articles = articleRes.list;
        _page = 1;
        _hasMore = articleRes.totalPages > 1;
        _loading = false;
      });
    } catch (e) {
      debugPrint('Load data error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_loading || !_hasMore) return;
    setState(() => _loading = true);
    try {
      final res = await _api.getArticles(
        page: _page + 1,
        pageSize: 20,
        category: _selectedCategory?.slug,
      );
      if (!mounted) return;
      setState(() {
        _articles.addAll(res.list);
        _page = res.page;
        _hasMore = res.page < res.totalPages;
        _loading = false;
      });
    } catch (e) {
      debugPrint('Load more error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  void _selectCategory(Category? category) {
    setState(() {
      _selectedCategory = _selectedCategory?.id == category?.id ? null : category;
      _articles = [];
      _page = 1;
      _hasMore = true;
    });
    _loadArticles();
  }

  Future<void> _loadArticles() async {
    setState(() => _loading = true);
    try {
      final res = await _api.getArticles(
        page: 1,
        pageSize: 20,
        category: _selectedCategory?.slug,
      );
      if (!mounted) return;
      setState(() {
        _articles = res.list;
        _page = 1;
        _hasMore = res.totalPages > 1;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('TechAI 资讯'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // 分类
            SliverToBoxAdapter(
              child: SizedBox(
                height: 52,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  itemCount: _categories.length,
                  itemBuilder: (context, index) {
                    final cat = _categories[index];
                    return CategoryChip(
                      category: cat,
                      isSelected: _selectedCategory?.id == cat.id,
                      onTap: () => _selectCategory(cat),
                    );
                  },
                ),
              ),
            ),

            // 文章列表
            if (_articles.isEmpty && _loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_articles.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.article_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4)),
                      const SizedBox(height: 16),
                      Text('暂无文章', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final article = _articles[index];
                    return ArticleCard(
                      article: article,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ArticleDetailScreen(articleId: article.id),
                          ),
                        ).then((_) => _loadData());
                      },
                    );
                  },
                  childCount: _articles.length,
                ),
              ),

            // 加载更多指示器
            if (_loading && _articles.isNotEmpty)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

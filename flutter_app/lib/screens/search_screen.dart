import 'package:flutter/material.dart';
import '../models/article.dart';
import '../services/api_service.dart';
import '../widgets/article_card.dart';
import 'article_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<Article> _results = [];
  bool _loading = false;
  bool _hasSearched = false;

  @override
  void dispose() {
    _searchController.dispose();
    _api.dispose();
    super.dispose();
  }

  Future<void> _search(String keyword) async {
    if (keyword.trim().isEmpty) return;
    setState(() {
      _loading = true;
      _hasSearched = true;
    });
    try {
      final res = await _api.getArticles(keyword: keyword.trim(), pageSize: 50);
      if (!mounted) return;
      setState(() {
        _results = res.list;
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
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: '搜索文章...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: theme.colorScheme.onSurfaceVariant),
          ),
          style: theme.textTheme.bodyLarge,
          onSubmitted: _search,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => _search(_searchController.text),
          ),
        ],
      ),
      body: _buildBody(theme),
    );
  }

  Widget _buildBody(ThemeData theme) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!_hasSearched) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search, size: 64, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            Text('输入关键词搜索文章', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
      );
    }

    if (_results.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 64, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            Text('未找到相关文章', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final article = _results[index];
        return ArticleCard(
          article: article,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ArticleDetailScreen(articleId: article.id),
              ),
            );
          },
        );
      },
    );
  }
}

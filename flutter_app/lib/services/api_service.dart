import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/article.dart';
import '../models/category.dart';
import '../models/comment.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:3001/api';

  final http.Client _client = http.Client();

  // ========== 文章 ==========

  Future<ArticleListResponse> getArticles({
    int page = 1,
    int pageSize = 20,
    String? category,
    String? keyword,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };
    if (category != null && category.isNotEmpty) params['category'] = category;
    if (keyword != null && keyword.isNotEmpty) params['keyword'] = keyword;

    final uri = Uri.parse('$baseUrl/articles').replace(queryParameters: params);
    final res = await _client.get(uri);
    return ArticleListResponse.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<Article?> getArticle(int id) async {
    final res = await _client.get(Uri.parse('$baseUrl/articles/$id'));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['code'] == 200 && body['data'] != null) {
      return Article.fromJson(body['data'] as Map<String, dynamic>);
    }
    return null;
  }

  // ========== 分类 ==========

  Future<List<Category>> getCategories() async {
    final res = await _client.get(Uri.parse('$baseUrl/categories'));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['code'] == 200 && body['data'] != null) {
      return (body['data'] as List<dynamic>)
          .map((c) => Category.fromJson(c as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  // ========== 标签 ==========

  Future<List<Tag>> getTags() async {
    final res = await _client.get(Uri.parse('$baseUrl/tags'));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['code'] == 200 && body['data'] != null) {
      return (body['data'] as List<dynamic>)
          .map((t) => Tag.fromJson(t as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  // ========== 点赞 ==========

  Future<int> likeArticle(int articleId) async {
    final res = await _client.post(Uri.parse('$baseUrl/articles/$articleId/like'));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['code'] == 200 && body['data'] != null) {
      return (body['data'] as Map<String, dynamic>)['like_count'] as int;
    }
    throw Exception('点赞失败');
  }

  // ========== 评论 ==========

  Future<CommentListResponse> getComments(int articleId, {int page = 1, int pageSize = 20}) async {
    final params = <String, String>{'page': page.toString(), 'pageSize': pageSize.toString()};
    final uri = Uri.parse('$baseUrl/articles/$articleId/comments').replace(queryParameters: params);
    final res = await _client.get(uri);
    return CommentListResponse.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<bool> postComment(int articleId, String nickname, String content) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/articles/$articleId/comments'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'nickname': nickname, 'content': content}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    return body['code'] == 200;
  }

  void dispose() {
    _client.close();
  }
}

// ========== 响应封装 ==========

class ArticleListResponse {
  final List<Article> list;
  final int total;
  final int page;
  final int pageSize;
  final int totalPages;

  ArticleListResponse({
    required this.list,
    required this.total,
    required this.page,
    required this.pageSize,
    required this.totalPages,
  });

  factory ArticleListResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return ArticleListResponse(
      list: (data['list'] as List<dynamic>)
          .map((a) => Article.fromJson(a as Map<String, dynamic>))
          .toList(),
      total: data['total'] as int? ?? 0,
      page: data['page'] as int? ?? 1,
      pageSize: data['pageSize'] as int? ?? 20,
      totalPages: data['totalPages'] as int? ?? 0,
    );
  }
}

class CommentListResponse {
  final List<Comment> list;
  final int total;
  final int page;
  final int pageSize;
  final int totalPages;

  CommentListResponse({
    required this.list,
    required this.total,
    required this.page,
    required this.pageSize,
    required this.totalPages,
  });

  factory CommentListResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>;
    return CommentListResponse(
      list: (data['list'] as List<dynamic>?)
              ?.map((c) => Comment.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      total: data['total'] as int? ?? 0,
      page: data['page'] as int? ?? 1,
      pageSize: data['pageSize'] as int? ?? 20,
      totalPages: data['totalPages'] as int? ?? 0,
    );
  }
}

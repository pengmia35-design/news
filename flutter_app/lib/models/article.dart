class Article {
  final int id;
  final String title;
  final String summary;
  final String content;
  final String coverUrl;
  final String sourceName;
  final String categoryName;
  final String categorySlug;
  final int categoryId;
  final int viewCount;
  final int likeCount;
  final int commentCount;
  final bool isFeatured;
  final String? publishedAt;
  final List<Tag> tags;
  final ArticleLink? prev;
  final ArticleLink? next;

  Article({
    required this.id,
    required this.title,
    this.summary = '',
    this.content = '',
    this.coverUrl = '',
    this.sourceName = '',
    this.categoryName = '',
    this.categorySlug = '',
    this.categoryId = 0,
    this.viewCount = 0,
    this.likeCount = 0,
    this.commentCount = 0,
    this.isFeatured = false,
    this.publishedAt,
    this.tags = const [],
    this.prev,
    this.next,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      content: json['content'] ?? json['content_preview'] ?? '',
      coverUrl: json['cover_url'] ?? '',
      sourceName: json['source_name'] ?? '',
      categoryName: json['category_name'] ?? '',
      categorySlug: json['category_slug'] ?? '',
      categoryId: json['category_id'] is int
          ? json['category_id']
          : int.tryParse(json['category_id']?.toString() ?? '0') ?? 0,
      viewCount: json['view_count'] is int
          ? json['view_count']
          : int.tryParse(json['view_count']?.toString() ?? '0') ?? 0,
      likeCount: json['like_count'] is int
          ? json['like_count']
          : int.tryParse(json['like_count']?.toString() ?? '0') ?? 0,
      commentCount: json['comment_count'] is int
          ? json['comment_count']
          : int.tryParse(json['comment_count']?.toString() ?? '0') ?? 0,
      isFeatured: json['is_featured'] == 1 || json['is_featured'] == true,
      publishedAt: json['published_at'],
      tags: (json['tags'] as List<dynamic>?)
              ?.map((t) => Tag.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      prev: json['prev'] != null
          ? ArticleLink.fromJson(json['prev'] as Map<String, dynamic>)
          : null,
      next: json['next'] != null
          ? ArticleLink.fromJson(json['next'] as Map<String, dynamic>)
          : null,
    );
  }

  String get formattedDate {
    if (publishedAt == null) return '';
    final d = DateTime.tryParse(publishedAt!);
    if (d == null) return '';
    return '${d.year}/${_pad(d.month)}/${_pad(d.day)}';
  }

  String get timeAgo {
    if (publishedAt == null) return '';
    final d = DateTime.tryParse(publishedAt!);
    if (d == null) return '';
    final now = DateTime.now();
    final diff = now.millisecondsSinceEpoch - d.millisecondsSinceEpoch;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return '${diff ~/ 60000} 分钟前';
    if (diff < 86400000) return '${diff ~/ 3600000} 小时前';
    if (diff < 2592000000) return '${diff ~/ 86400000} 天前';
    return formattedDate;
  }

  String _pad(int n) => n.toString().padLeft(2, '0');
}

class Tag {
  final int id;
  final String name;
  final String slug;

  Tag({required this.id, required this.name, this.slug = ''});

  factory Tag.fromJson(Map<String, dynamic> json) {
    return Tag(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
    );
  }
}

class ArticleLink {
  final int id;
  final String title;

  ArticleLink({required this.id, required this.title});

  factory ArticleLink.fromJson(Map<String, dynamic> json) {
    return ArticleLink(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      title: json['title'] ?? '',
    );
  }
}

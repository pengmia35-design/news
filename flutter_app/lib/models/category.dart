class Category {
  final int id;
  final String name;
  final String slug;
  final String description;
  final int articleCount;

  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description = '',
    this.articleCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'] ?? '',
      articleCount: json['article_count'] is int
          ? json['article_count']
          : int.tryParse(json['article_count']?.toString() ?? '0') ?? 0,
    );
  }

  static const categories = [
    'AI行业资讯', '算力&云服务', '芯片&英伟达',
    '开发工具', '前沿科技动态', 'AI行业应用'
  ];
}

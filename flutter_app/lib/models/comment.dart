class Comment {
  final int id;
  final String nickname;
  final String content;
  final String createdAt;

  Comment({
    required this.id,
    required this.nickname,
    required this.content,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      nickname: json['nickname'] ?? '',
      content: json['content'] ?? '',
      createdAt: json['created_at'] ?? '',
    );
  }

  String get timeAgo {
    final d = DateTime.tryParse(createdAt);
    if (d == null) return '';
    final now = DateTime.now();
    final diff = now.millisecondsSinceEpoch - d.millisecondsSinceEpoch;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return '${diff ~/ 60000} 分钟前';
    if (diff < 86400000) return '${diff ~/ 3600000} 小时前';
    if (diff < 2592000000) return '${diff ~/ 86400000} 天前';
    return '${d.year}/${d.month.toString().padLeft(2, '0')}/${d.day.toString().padLeft(2, '0')}';
  }
}

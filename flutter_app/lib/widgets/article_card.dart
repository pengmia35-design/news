import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/article.dart';

class ArticleCard extends StatelessWidget {
  final Article article;
  final VoidCallback onTap;

  const ArticleCard({super.key, required this.article, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (article.coverUrl.isNotEmpty)
              CachedNetworkImage(
                imageUrl: article.coverUrl,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  height: 180,
                  color: theme.colorScheme.surfaceContainerHighest,
                  child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                ),
                errorWidget: (_, __, ___) => Container(
                  height: 180,
                  color: theme.colorScheme.surfaceContainerHighest,
                  child: Icon(Icons.broken_image, color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          article.categoryName,
                          style: TextStyle(
                            fontSize: 11,
                            color: theme.colorScheme.onPrimaryContainer,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      if (article.isFeatured) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '置顶',
                            style: TextStyle(fontSize: 11, color: Colors.orange.shade800),
                          ),
                        ),
                      ],
                      const Spacer(),
                      if (article.sourceName.isNotEmpty)
                        Text(
                          article.sourceName,
                          style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    article.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (article.summary.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      article.summary,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.remove_red_eye_outlined, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 3),
                      Text(_formatCount(article.viewCount), style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                      const SizedBox(width: 14),
                      Icon(Icons.favorite_border, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 3),
                      Text(_formatCount(article.likeCount), style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                      const SizedBox(width: 14),
                      Icon(Icons.chat_bubble_outline, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 3),
                      Text(_formatCount(article.commentCount), style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                      const Spacer(),
                      Text(article.timeAgo, style: TextStyle(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 10000) return '${(count / 10000).toStringAsFixed(1)}w';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return count.toString();
  }
}

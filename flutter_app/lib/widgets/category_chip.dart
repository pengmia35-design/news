import 'package:flutter/material.dart';
import '../models/category.dart';

class CategoryChip extends StatelessWidget {
  final Category category;
  final bool isSelected;
  final VoidCallback onTap;

  const CategoryChip({
    super.key,
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          category.name,
          style: TextStyle(
            fontSize: 13,
            color: isSelected ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surfaceContainerHighest,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const TechAINewsApp());
}

class TechAINewsApp extends StatelessWidget {
  const TechAINewsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TechAI 资讯',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1E40AF),
        useMaterial3: true,
        brightness: Brightness.light,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          scrolledUnderElevation: 1,
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: const Color(0xFF1E40AF),
        useMaterial3: true,
        brightness: Brightness.dark,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          scrolledUnderElevation: 1,
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      themeMode: ThemeMode.system,
      home: const HomeScreen(),
    );
  }
}

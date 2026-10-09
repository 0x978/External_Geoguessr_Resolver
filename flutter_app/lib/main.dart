import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/connect_screen.dart';
import 'services/websocket_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0A0A0A),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  runApp(const GeoResolverApp());
}

class GeoResolverApp extends StatefulWidget {
  const GeoResolverApp({super.key});

  @override
  State<GeoResolverApp> createState() => _GeoResolverAppState();
}

class _GeoResolverAppState extends State<GeoResolverApp> {
  final WebSocketService _wsService = WebSocketService();

  @override
  void dispose() {
    _wsService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoGuessr Live Viewer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: const Color(0xFF0A0A0A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF56FF0A),
          secondary: Color(0xFF56FF0A),
          surface: Color(0xFF171717),
        ),
      ),
      home: ConnectScreen(wsService: _wsService),
    );
  }
}

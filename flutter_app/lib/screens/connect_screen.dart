import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/websocket_service.dart';
import 'dashboard_screen.dart';

class ConnectScreen extends StatefulWidget {
  final WebSocketService wsService;

  const ConnectScreen({super.key, required this.wsService});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  static const Color neonGreen = Color(0xFF56FF0A);
  static const Color bgDark = Color(0xFF0A0A0A);
  static const Color cardDark = Color(0xFF141414);
  static const Color borderDark = Color(0xFF262626);

  static const String defaultUserId = '11111111-1111-4111-8111-111111111111';

  final TextEditingController _tokenController = TextEditingController(
    text: defaultUserId,
  );
  final TextEditingController _serverController = TextEditingController(
    text: WebSocketService.defaultServerUrl,
  );

  bool _isConnecting = false;
  bool _showCustomServer = false;
  String? _errorText;

  static final RegExp _uuidRegex = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    caseSensitive: false,
  );

  @override
  void initState() {
    super.initState();
    _loadSavedPrefs();
  }

  Future<void> _loadSavedPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('latestToken');
    final savedServer = prefs.getString('serverUrl');
    if (!mounted) return;
    setState(() {
      if (savedToken != null && savedToken.isNotEmpty) {
        _tokenController.text = savedToken;
      }
      if (savedServer != null && savedServer.isNotEmpty) {
        _serverController.text = savedServer;
        if (savedServer != WebSocketService.defaultServerUrl) {
          _showCustomServer = true;
        }
      }
    });
  }

  Future<void> _pasteToken() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null && data!.text!.trim().isNotEmpty) {
      setState(() {
        _tokenController.text = data.text!.trim();
        _errorText = null;
      });
    }
  }

  Future<void> _handleConnect() async {
    final token = _tokenController.text.trim();
    if (token.isEmpty) {
      setState(() {
        _errorText = 'Please enter your User ID Token.';
      });
      return;
    }

    if (!_uuidRegex.hasMatch(token)) {
      setState(() {
        _errorText = 'Invalid User ID format (must be a valid UUID).';
      });
      return;
    }

    setState(() {
      _isConnecting = true;
      _errorText = null;
    });

    final serverUrl = _showCustomServer
        ? _serverController.text.trim()
        : WebSocketService.defaultServerUrl;

    final success = await widget.wsService.connect(
      token,
      customServerUrl: serverUrl,
    );

    if (!mounted) return;

    setState(() {
      _isConnecting = false;
    });

    if (success) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('latestToken', token);
      await prefs.setString('serverUrl', widget.wsService.serverUrl);

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => DashboardScreen(wsService: widget.wsService),
        ),
      );
    } else {
      setState(() {
        _errorText =
            widget.wsService.error ?? 'Failed to connect to WebSocket.';
      });
    }
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgDark,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Header Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      vertical: 28,
                      horizontal: 20,
                    ),
                    decoration: BoxDecoration(
                      color: cardDark,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: borderDark),
                      boxShadow: [
                        BoxShadow(
                          color: neonGreen.withAlpha(20),
                          blurRadius: 24,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 76,
                          height: 76,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: neonGreen.withAlpha(110),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: neonGreen.withAlpha(45),
                                blurRadius: 16,
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16.5),
                            child: Image.asset(
                              'assets/icon/app_icon.png',
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'GeoGuessr Live Viewer',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.w800,
                            color: neonGreen,
                            shadows: [
                              Shadow(
                                color: neonGreen.withAlpha(102),
                                blurRadius: 12,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Real-Time Location & Interactive Map',
                          style: TextStyle(
                            color: Colors.white54,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Connect Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cardDark,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: borderDark),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.bolt, color: neonGreen, size: 26),
                            const SizedBox(width: 6),
                            Text(
                              'Live Connect',
                              style: TextStyle(
                                fontSize: 21,
                                fontWeight: FontWeight.bold,
                                color: neonGreen,
                                shadows: [
                                  Shadow(
                                    color: neonGreen.withAlpha(90),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'User ID Token',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                setState(() {
                                  _tokenController.text = defaultUserId;
                                  _errorText = null;
                                });
                              },
                              child: const Text(
                                'Use Default ID',
                                style: TextStyle(
                                  color: neonGreen,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _tokenController,
                          enabled: !_isConnecting,
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'monospace',
                            fontSize: 13.5,
                          ),
                          onSubmitted: (_) => _handleConnect(),
                          decoration: InputDecoration(
                            hintText: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                            hintStyle: const TextStyle(color: Colors.white30),
                            filled: true,
                            fillColor: const Color(0xFF1F1F1F),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 14,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: borderDark),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: borderDark),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: neonGreen),
                            ),
                            suffixIcon: IconButton(
                              tooltip: 'Paste from clipboard',
                              icon: const Icon(
                                Icons.content_paste,
                                color: Colors.white60,
                                size: 20,
                              ),
                              onPressed: _isConnecting ? null : _pasteToken,
                            ),
                          ),
                        ),

                        const SizedBox(height: 12),

                        // Server toggle (Default vs Local PC Server)
                        InkWell(
                          borderRadius: BorderRadius.circular(8),
                          onTap: () {
                            setState(() {
                              _showCustomServer = !_showCustomServer;
                            });
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Row(
                              children: [
                                Icon(
                                  _showCustomServer
                                      ? Icons.keyboard_arrow_up
                                      : Icons.settings_ethernet,
                                  color: Colors.white54,
                                  size: 18,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _showCustomServer
                                      ? 'Hide server settings'
                                      : 'Configure custom / local server (optional)',
                                  style: const TextStyle(
                                    color: Colors.white54,
                                    fontSize: 12.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        if (_showCustomServer) ...[
                          const SizedBox(height: 8),
                          TextField(
                            controller: _serverController,
                            enabled: !_isConnecting,
                            style: const TextStyle(
                              color: Colors.white,
                              fontFamily: 'monospace',
                              fontSize: 13,
                            ),
                            decoration: InputDecoration(
                              labelText: 'WebSocket Server or Local PC IP',
                              labelStyle: const TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                              ),
                              hintText: 'e.g. 192.168.1.15:8000 or wss://...',
                              hintStyle: const TextStyle(color: Colors.white30),
                              filled: true,
                              fillColor: const Color(0xFF1F1F1F),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 12,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: borderDark),
                              ),
                              suffixIcon: IconButton(
                                tooltip: 'Reset to default server',
                                icon: const Icon(
                                  Icons.restore,
                                  color: Colors.white54,
                                  size: 18,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _serverController.text =
                                        WebSocketService.defaultServerUrl;
                                  });
                                },
                              ),
                            ),
                          ),
                        ],

                        if (_errorText != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.red.withAlpha(30),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: Colors.redAccent.withAlpha(102),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  color: Colors.redAccent,
                                  size: 18,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorText!,
                                    style: const TextStyle(
                                      color: Colors.redAccent,
                                      fontSize: 12.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 18),

                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isConnecting ? null : _handleConnect,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: neonGreen,
                              foregroundColor: Colors.black,
                              disabledBackgroundColor: neonGreen.withAlpha(102),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              textStyle: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            child: _isConnecting
                                ? const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.4,
                                          color: Colors.black,
                                        ),
                                      ),
                                      SizedBox(width: 10),
                                      Text('Connecting...'),
                                    ],
                                  )
                                : const Text('Connect'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/location_data.dart';

class WebSocketService extends ChangeNotifier {
  static const String defaultServerUrl = 'wss://georesolver.0x978.com/ws';

  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;

  bool _isConnected = false;
  bool _isConnecting = false;
  bool _isReconnecting = false;
  bool _manualDisconnect = false;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;

  String? _sessionId;
  String _serverUrl = defaultServerUrl;
  LocationData? _locationData;
  String? _error;

  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;
  bool get isReconnecting => _isReconnecting;
  LocationData? get locationData => _locationData;
  String? get error => _error;
  String? get sessionId => _sessionId;
  String get serverUrl => _serverUrl;

  /// Normalizes user-provided server address into a valid ws:// or wss:// URL ending with /ws
  static String normalizeServerUrl(String rawInput) {
    String trimmed = rawInput.trim();
    if (trimmed.isEmpty) {
      return defaultServerUrl;
    }
    // Remove trailing slash
    while (trimmed.endsWith('/')) {
      trimmed = trimmed.substring(0, trimmed.length - 1);
    }
    if (!trimmed.startsWith('ws://') && !trimmed.startsWith('wss://')) {
      if (trimmed.startsWith('https://')) {
        trimmed = 'wss://${trimmed.substring(8)}';
      } else if (trimmed.startsWith('http://')) {
        trimmed = 'ws://${trimmed.substring(7)}';
      } else {
        // If user entered just IP like 192.168.1.15, add port 8000 if no port present
        if (!trimmed.contains(':') && !trimmed.contains('.com')) {
          trimmed = 'ws://$trimmed:8000';
        } else {
          trimmed = 'ws://$trimmed';
        }
      }
    }
    if (!trimmed.endsWith('/ws')) {
      trimmed = '$trimmed/ws';
    }
    return trimmed;
  }

  Future<bool> connect(String sessionId, {String? customServerUrl}) async {
    if (_isConnecting || _isConnected) {
      return _isConnected;
    }

    _manualDisconnect = false;
    _isConnecting = true;
    _error = null;
    _sessionId = sessionId.trim();
    if (customServerUrl != null && customServerUrl.trim().isNotEmpty) {
      _serverUrl = normalizeServerUrl(customServerUrl);
    }
    _clearTimers();
    notifyListeners();

    try {
      final fullUrl = '$_serverUrl/$_sessionId';
      final uri = Uri.parse(fullUrl);
      final channel = WebSocketChannel.connect(uri);
      _channel = channel;

      // Wait for connection ready with timeout
      await channel.ready.timeout(const Duration(seconds: 10));

      _isConnected = true;
      _isConnecting = false;
      _isReconnecting = false;
      _reconnectAttempts = 0;
      notifyListeners();

      _subscription = channel.stream.listen(
        (dynamic message) {
          try {
            final Map<String, dynamic> decoded =
                jsonDecode(message as String) as Map<String, dynamic>;
            _locationData = LocationData.fromJson(decoded);
            notifyListeners();
          } catch (e) {
            debugPrint('Error parsing WebSocket message: $e');
          }
        },
        onError: (Object err) {
          debugPrint('WebSocket stream error: $err');
          _handleDisconnection(errorMessage: 'WebSocket connection error');
        },
        onDone: () {
          debugPrint('WebSocket closed');
          _handleDisconnection();
        },
      );

      return true;
    } catch (e) {
      debugPrint('Failed to connect WebSocket: $e');
      _isConnected = false;
      _isConnecting = false;
      _error = 'Failed to connect to server ($_serverUrl).';
      notifyListeners();
      if (_isReconnecting) {
        _attemptReconnect();
      }
      return false;
    }
  }

  void _handleDisconnection({String? errorMessage}) {
    _isConnected = false;
    _isConnecting = false;
    _subscription?.cancel();
    _subscription = null;
    _channel = null;

    if (!_manualDisconnect && _sessionId != null) {
      _attemptReconnect();
    } else {
      if (errorMessage != null) {
        _error = errorMessage;
      }
      notifyListeners();
    }
  }

  void _attemptReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _isReconnecting = false;
      _error = 'Connection lost. Please reconnect.';
      notifyListeners();
      return;
    }

    _isReconnecting = true;
    notifyListeners();

    final delaySeconds = (3 * (1 + _reconnectAttempts * 0.5)).round().clamp(3, 30);
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      if (_sessionId != null && !_isConnected && !_isConnecting && !_manualDisconnect) {
        _reconnectAttempts++;
        connect(_sessionId!, customServerUrl: _serverUrl);
      }
    });
  }

  void disconnect() {
    _manualDisconnect = true;
    _clearTimers();
    _reconnectAttempts = 0;
    _subscription?.cancel();
    _subscription = null;
    _channel?.sink.close(1000);
    _channel = null;
    _isConnected = false;
    _isConnecting = false;
    _isReconnecting = false;
    _locationData = null;
    _error = null;
    notifyListeners();
  }

  void _clearTimers() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}

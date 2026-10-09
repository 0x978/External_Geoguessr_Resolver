import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/location_data.dart';
import '../services/geocoding_service.dart';
import '../services/websocket_service.dart';
import 'connect_screen.dart';

class _MapStyleOption {
  final String id;
  final String label;
  final IconData icon;
  final String urlTemplate;

  const _MapStyleOption({
    required this.id,
    required this.label,
    required this.icon,
    required this.urlTemplate,
  });
}

class DashboardScreen extends StatefulWidget {
  final WebSocketService wsService;

  const DashboardScreen({super.key, required this.wsService});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  static const Color neonGreen = Color(0xFF56FF0A);
  static const Color bgDark = Color(0xFF0A0A0A);
  static const Color cardDark = Color(0xFF141414);
  static const Color tileDark = Color(0xFF1C1C1C);
  static const Color borderDark = Color(0xFF282828);

  static const List<_MapStyleOption> _mapStyles = [
    _MapStyleOption(
      id: 'voyager',
      label: 'Clean HD',
      icon: Icons.map_outlined,
      urlTemplate:
          'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    ),
    _MapStyleOption(
      id: 'osm',
      label: 'Streets',
      icon: Icons.directions_rounded,
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    ),
    _MapStyleOption(
      id: 'satellite',
      label: 'Satellite',
      icon: Icons.satellite_alt_outlined,
      urlTemplate:
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ),
    _MapStyleOption(
      id: 'dark',
      label: 'Dark',
      icon: Icons.dark_mode_outlined,
      urlTemplate:
          'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    ),
  ];

  final MapController _mapController = MapController();

  LocationDetails _details = const LocationDetails();
  bool _isLoadingDetails = false;
  bool _isFullScreenMap = false;
  int _selectedStyleIndex = 0;
  double? _lastLat;
  double? _lastLng;
  double _currentZoom = 6.0;

  @override
  void initState() {
    super.initState();
    widget.wsService.addListener(_onWsUpdate);
    _onWsUpdate();
  }

  void _onWsUpdate() {
    if (!mounted) return;
    final loc = widget.wsService.locationData;
    if (loc != null && (loc.lat != _lastLat || loc.lng != _lastLng)) {
      _lastLat = loc.lat;
      _lastLng = loc.lng;

      // Center map on new round location
      WidgetsBinding.instance.addPostFrameCallback((_) {
        try {
          _mapController.move(LatLng(loc.lat, loc.lng), _currentZoom);
        } catch (_) {}
      });

      _fetchLocationDetails(loc.lat, loc.lng);
    } else {
      setState(() {});
    }
  }

  Future<void> _fetchLocationDetails(double lat, double lng) async {
    setState(() {
      _isLoadingDetails = true;
    });

    final result = await GeocodingService.reverseGeocode(lat, lng);
    if (!mounted) return;

    setState(() {
      _details = result;
      _isLoadingDetails = false;
    });
  }

  void _disconnectAndReturn() {
    widget.wsService.removeListener(_onWsUpdate);
    widget.wsService.disconnect();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ConnectScreen(wsService: widget.wsService),
      ),
    );
  }

  void _setZoomPreset(double targetZoom) {
    final loc = widget.wsService.locationData;
    if (loc == null) return;
    setState(() {
      _currentZoom = targetZoom;
    });
    try {
      _mapController.move(LatLng(loc.lat, loc.lng), targetZoom);
    } catch (_) {}
  }

  void _zoomBy(double delta) {
    final loc = widget.wsService.locationData;
    if (loc == null) return;
    final newZoom = (_currentZoom + delta).clamp(2.0, 18.5);
    setState(() {
      _currentZoom = newZoom;
    });
    try {
      final center = _mapController.camera.center;
      _mapController.move(center, newZoom);
    } catch (_) {
      _mapController.move(LatLng(loc.lat, loc.lng), newZoom);
    }
  }

  void _recenterOnPin() {
    final loc = widget.wsService.locationData;
    if (loc == null) return;
    try {
      _mapController.move(LatLng(loc.lat, loc.lng), _currentZoom);
    } catch (_) {}
  }

  void _cycleMapStyle() {
    setState(() {
      _selectedStyleIndex = (_selectedStyleIndex + 1) % _mapStyles.length;
    });
  }

  Future<void> _copyText(String label, String text) async {
    if (text == '—' || text.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: cardDark,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(color: neonGreen.withAlpha(100)),
        ),
        content: Text(
          'Copied $label: $text',
          style: const TextStyle(color: neonGreen, fontWeight: FontWeight.w600),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  void dispose() {
    widget.wsService.removeListener(_onWsUpdate);
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = widget.wsService.locationData;
    final isConnected = widget.wsService.isConnected;
    final isReconnecting = widget.wsService.isReconnecting;

    return Scaffold(
      backgroundColor: bgDark,
      appBar: _isFullScreenMap
          ? null
          : AppBar(
              backgroundColor: cardDark,
              surfaceTintColor: Colors.transparent,
              elevation: 0,
              title: Row(
                children: [
                  const Icon(Icons.public, color: neonGreen, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'GeoGuessr Live',
                    style: TextStyle(
                      color: neonGreen,
                      fontWeight: FontWeight.w800,
                      fontSize: 18,
                      shadows: [
                        Shadow(
                          color: neonGreen.withAlpha(90),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                _buildStatusBadge(isConnected, isReconnecting),
                const SizedBox(width: 6),
                IconButton(
                  tooltip: 'Disconnect',
                  onPressed: _disconnectAndReturn,
                  icon: const Icon(
                    Icons.logout_rounded,
                    color: Colors.white70,
                    size: 20,
                  ),
                ),
              ],
            ),
      body: loc == null
          ? _buildWaitingScreen()
          : _isFullScreenMap
              ? SafeArea(child: _buildFullScreenMap(loc))
              : SafeArea(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // 1. Instant Top Summary Banner (Country + Region/City + Road)
                        _buildTopSummaryBanner(loc),
                        const SizedBox(height: 12),

                        // 2. Enhanced Map View Card
                        _buildMapCard(loc),
                        const SizedBox(height: 14),

                        // 3. Detailed Location Grid
                        _buildLocationDetailsCard(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildTopSummaryBanner(LocationData loc) {
    final country = _details.country != '—' ? _details.country : 'Locating...';
    final cityOrState = [
      if (_details.displayCity != '—') _details.displayCity,
      if (_details.state != '—') _details.state,
    ].join(' • ');
    final road = _details.road != '—' ? _details.road : '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            neonGreen.withAlpha(28),
            cardDark,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: neonGreen.withAlpha(90), width: 1.2),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: neonGreen.withAlpha(32),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.flag_rounded,
              color: neonGreen,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  country.toUpperCase(),
                  style: const TextStyle(
                    color: neonGreen,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                  ),
                ),
                if (cityOrState.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    cityOrState,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                if (road.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    road,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12.5,
                    ),
                  ),
                ],
              ],
            ),
          ),
          InkWell(
            borderRadius: BorderRadius.circular(10),
            onTap: () => _copyText(
              'Coordinates',
              '${loc.lat.toStringAsFixed(6)}, ${loc.lng.toStringAsFixed(6)}',
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: tileDark,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: borderDark),
              ),
              child: Column(
                children: [
                  const Icon(Icons.copy_rounded, color: neonGreen, size: 15),
                  const SizedBox(height: 3),
                  Text(
                    '${loc.lat.toStringAsFixed(3)}\n${loc.lng.toStringAsFixed(3)}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontFamily: 'monospace',
                      fontSize: 10,
                      height: 1.15,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapCard(LocationData loc) {
    final currentStyle = _mapStyles[_selectedStyleIndex];

    return Container(
      decoration: BoxDecoration(
        color: cardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderDark),
      ),
      child: Column(
        children: [
          // Map Header Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.explore_rounded, color: neonGreen, size: 20),
                    SizedBox(width: 7),
                    Text(
                      'Interactive Map',
                      style: TextStyle(
                        color: neonGreen,
                        fontSize: 16.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    // Map layer style switcher button
                    InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: _cycleMapStyle,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: tileDark,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: borderDark),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              currentStyle.icon,
                              color: neonGreen,
                              size: 15,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              currentStyle.label,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Fullscreen toggle button
                    InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () {
                        setState(() {
                          _isFullScreenMap = true;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: neonGreen.withAlpha(28),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: neonGreen.withAlpha(90)),
                        ),
                        child: const Row(
                          children: [
                            Icon(
                              Icons.fullscreen_rounded,
                              color: neonGreen,
                              size: 17,
                            ),
                            SizedBox(width: 3),
                            Text(
                              'Expand',
                              style: TextStyle(
                                color: neonGreen,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Map Viewport (400px tall for easy pinching & reading)
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              bottom: Radius.circular(15),
            ),
            child: SizedBox(
              height: 400,
              child: _buildInteractiveMapStack(loc),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFullScreenMap(LocationData loc) {
    final currentStyle = _mapStyles[_selectedStyleIndex];
    final summaryText = [
      if (_details.country != '—') _details.country,
      if (_details.displayCity != '—') _details.displayCity,
      if (_details.road != '—') _details.road,
    ].join(' • ');

    return Stack(
      children: [
        Positioned.fill(
          child: _buildInteractiveMapStack(loc, isFullScreen: true),
        ),
        // Top floating overlay in fullscreen mode
        Positioned(
          top: 12,
          left: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: cardDark.withAlpha(235),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: neonGreen.withAlpha(90)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(150),
                  blurRadius: 12,
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.place_rounded, color: neonGreen, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    summaryText.isNotEmpty ? summaryText : 'Live Round Location',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: _cycleMapStyle,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: tileDark,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: borderDark),
                    ),
                    child: Row(
                      children: [
                        Icon(currentStyle.icon, color: neonGreen, size: 15),
                        const SizedBox(width: 4),
                        Text(
                          currentStyle.label,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: () {
                    setState(() {
                      _isFullScreenMap = false;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: neonGreen,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.fullscreen_exit_rounded,
                      color: Colors.black,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInteractiveMapStack(
    LocationData loc, {
    bool isFullScreen = false,
  }) {
    final currentStyle = _mapStyles[_selectedStyleIndex];
    final pinLabel = [
      if (_details.displayCity != '—') _details.displayCity,
      if (_details.country != '—') _details.country,
    ].join(', ');

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: LatLng(loc.lat, loc.lng),
            initialZoom: _currentZoom,
            // Lock rotation so two-finger pinch never twists the map upside down
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
            ),
            onPositionChanged: (pos, _) {
              _currentZoom = pos.zoom;
            },
          ),
          children: [
            TileLayer(
              urlTemplate: currentStyle.urlTemplate,
              userAgentPackageName: 'com.georesolver.mobile',
            ),
            // Precision Target Marker (doesn't obscure the road intersection underneath)
            MarkerLayer(
              markers: [
                Marker(
                  point: LatLng(loc.lat, loc.lng),
                  width: 160,
                  height: 90,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (pinLabel.isNotEmpty)
                        Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withAlpha(210),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: neonGreen.withAlpha(180),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            pinLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: neonGreen,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      // Precision Bullseye Ring + Exact Center Dot
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.redAccent.withAlpha(45),
                          border: Border.all(
                            color: Colors.redAccent,
                            width: 2.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(120),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        child: Center(
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: neonGreen,
                              border: Border.all(
                                color: Colors.black,
                                width: 1.5,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),

        // Right-side floating controls (Recenter + Zoom In/Out)
        Positioned(
          right: 12,
          bottom: 58,
          child: Column(
            children: [
              _mapControlButton(
                icon: Icons.my_location_rounded,
                tooltip: 'Center on Pin',
                highlight: true,
                onTap: _recenterOnPin,
              ),
              const SizedBox(height: 8),
              _mapControlButton(
                icon: Icons.add_rounded,
                tooltip: 'Zoom In',
                onTap: () => _zoomBy(1.5),
              ),
              const SizedBox(height: 8),
              _mapControlButton(
                icon: Icons.remove_rounded,
                tooltip: 'Zoom Out',
                onTap: () => _zoomBy(-1.5),
              ),
            ],
          ),
        ),

        // Bottom 1-Tap Quick Zoom Preset Bar (World / Country / City / 5K Street)
        Positioned(
          left: 10,
          right: 10,
          bottom: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
            decoration: BoxDecoration(
              color: cardDark.withAlpha(235),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderDark),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(140),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              children: [
                _zoomPresetButton(
                  label: 'World',
                  icon: Icons.public,
                  targetZoom: 3.2,
                ),
                const SizedBox(width: 6),
                _zoomPresetButton(
                  label: 'Country',
                  icon: Icons.flag_outlined,
                  targetZoom: 5.8,
                ),
                const SizedBox(width: 6),
                _zoomPresetButton(
                  label: 'Region',
                  icon: Icons.location_city_rounded,
                  targetZoom: 10.5,
                ),
                const SizedBox(width: 6),
                _zoomPresetButton(
                  label: '5K Pin',
                  icon: Icons.gps_fixed_rounded,
                  targetZoom: 16.2,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _zoomPresetButton({
    required String label,
    required IconData icon,
    required double targetZoom,
  }) {
    final isSelected = (_currentZoom - targetZoom).abs() < 1.6;

    return Expanded(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: () => _setZoomPreset(targetZoom),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 7),
          decoration: BoxDecoration(
            color: isSelected ? neonGreen : tileDark,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? neonGreen : borderDark,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 14,
                color: isSelected ? Colors.black : neonGreen,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationDetailsCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderDark),
      ),
      child: Column(
        children: [
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.list_alt_rounded, color: neonGreen, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Location Details',
                    style: TextStyle(
                      color: neonGreen,
                      fontSize: 16.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              Text(
                'Tap any tile to copy',
                style: TextStyle(
                  color: Colors.white38,
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoadingDetails)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Column(
                children: [
                  CircularProgressIndicator(color: neonGreen),
                  SizedBox(height: 12),
                  Text(
                    'Fetching address details...',
                    style: TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            )
          else
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.9,
              children: [
                _buildDetailTile('Country', _details.country, Icons.public),
                _buildDetailTile(
                  'State / Region',
                  _details.state,
                  Icons.map_outlined,
                ),
                _buildDetailTile('County', _details.county, Icons.route),
                _buildDetailTile(
                  'City / Town',
                  _details.displayCity,
                  Icons.location_city,
                ),
                _buildDetailTile(
                  'Area',
                  _details.displayArea,
                  Icons.home_work_outlined,
                ),
                _buildDetailTile('Road', _details.road, Icons.alt_route),
                _buildDetailTile(
                  'Postcode',
                  _details.postcode,
                  Icons.pin_drop_outlined,
                ),
                _buildDetailTile(
                  'Place',
                  _details.displayPlace,
                  Icons.place_outlined,
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildWaitingScreen() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardDark,
                shape: BoxShape.circle,
                border: Border.all(color: borderDark),
              ),
              child: const SizedBox(
                width: 42,
                height: 42,
                child: CircularProgressIndicator(
                  color: neonGreen,
                  strokeWidth: 3.5,
                ),
              ),
            ),
            const SizedBox(height: 22),
            const Text(
              'Waiting for game info',
              style: TextStyle(
                color: neonGreen,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Start a GeoGuessr game on your PC.\nThe live map and location will appear automatically.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white60,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 28),
            OutlinedButton.icon(
              onPressed: _disconnectAndReturn,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white70,
                side: const BorderSide(color: borderDark),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
              ),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Back to Connect'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(bool connected, bool reconnecting) {
    Color color = Colors.redAccent;
    String label = 'Offline';
    if (reconnecting) {
      color = Colors.amber;
      label = 'Reconnecting';
    } else if (connected) {
      color = neonGreen;
      label = 'Online';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(36),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(128)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailTile(String label, String value, IconData icon) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => _copyText(label, value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: tileDark,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderDark),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: neonGreen, size: 14),
                const SizedBox(width: 5),
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 5),
            Text(
              value,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _mapControlButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
    bool highlight = false,
  }) {
    return Material(
      color: highlight ? neonGreen : cardDark.withAlpha(235),
      borderRadius: BorderRadius.circular(10),
      elevation: 4,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: highlight ? neonGreen : borderDark,
            ),
          ),
          child: Icon(
            icon,
            color: highlight ? Colors.black : neonGreen,
            size: 21,
          ),
        ),
      ),
    );
  }
}

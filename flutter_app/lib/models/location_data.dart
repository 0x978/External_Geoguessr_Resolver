class LocationData {
  final double lat;
  final double lng;
  final double timestamp;
  final String sessionId;

  const LocationData({
    required this.lat,
    required this.lng,
    required this.timestamp,
    required this.sessionId,
  });

  factory LocationData.fromJson(Map<String, dynamic> json) {
    return LocationData(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      timestamp: (json['timestamp'] as num?)?.toDouble() ??
          DateTime.now().millisecondsSinceEpoch / 1000.0,
      sessionId: (json['sessionId'] as String?) ?? '',
    );
  }
}

class LocationDetails {
  final String country;
  final String state;
  final String county;
  final String city;
  final String town;
  final String village;
  final String road;
  final String postcode;
  final String formattedAddress;
  final String neighborhood;
  final String sublocality;
  final String premise;
  final String locationName;

  const LocationDetails({
    this.country = '—',
    this.state = '—',
    this.county = '—',
    this.city = '—',
    this.town = '—',
    this.village = '—',
    this.road = '—',
    this.postcode = '—',
    this.formattedAddress = '—',
    this.neighborhood = '—',
    this.sublocality = '—',
    this.premise = '—',
    this.locationName = '—',
  });

  String get displayCity =>
      city != '—' ? city : (town != '—' ? town : (village != '—' ? village : '—'));

  String get displayArea =>
      neighborhood != '—' ? neighborhood : (sublocality != '—' ? sublocality : '—');

  String get displayPlace =>
      locationName != '—' ? locationName : (premise != '—' ? premise : '—');
}

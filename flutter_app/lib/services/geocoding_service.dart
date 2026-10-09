import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/location_data.dart';

class GeocodingService {
  static Future<LocationDetails> reverseGeocode(double lat, double lng) async {
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json&addressdetails=1&zoom=18',
      );

      final response = await http.get(
        uri,
        headers: {
          'User-Agent': 'GeoResolverMobile/1.0',
          'Accept-Language': 'en',
        },
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode != 200) {
        throw Exception('HTTP status ${response.statusCode}');
      }

      final Map<String, dynamic> data =
          jsonDecode(response.body) as Map<String, dynamic>;

      final Map<String, dynamic>? address =
          data['address'] as Map<String, dynamic>?;

      if (address == null) {
        return LocationDetails(
          formattedAddress: (data['display_name'] as String?) ?? 'Unknown location',
        );
      }

      String valOrDash(String? v) => (v != null && v.trim().isNotEmpty) ? v : '—';

      final country = valOrDash(address['country'] as String?);
      final state = valOrDash(address['state'] as String?);
      final county = valOrDash(address['county'] as String?);
      final city = valOrDash(address['city'] as String?);
      final town = valOrDash(address['town'] as String?);
      final village = valOrDash(address['village'] as String?);
      final road = valOrDash(address['road'] as String?);
      final postcode = valOrDash(address['postcode'] as String?);

      final neighborhood = valOrDash(
        (address['neighbourhood'] ??
            address['suburb'] ??
            address['residential']) as String?,
      );
      final sublocality = valOrDash(
        (address['hamlet'] ?? address['suburb']) as String?,
      );

      final houseNumber = address['house_number'] as String?;

      String locationName = '—';
      if (houseNumber != null && road != '—') {
        locationName = '$houseNumber $road';
      } else if (neighborhood != '—') {
        locationName = neighborhood;
      } else if (sublocality != '—') {
        locationName = sublocality;
      } else if (city != '—') {
        locationName = city;
      }

      return LocationDetails(
        country: country,
        state: state,
        county: county,
        city: city,
        town: town,
        village: village,
        road: road,
        postcode: postcode,
        formattedAddress: (data['display_name'] as String?) ?? 'Unknown location',
        neighborhood: neighborhood,
        sublocality: sublocality,
        premise: houseNumber ?? '—',
        locationName: locationName,
      );
    } catch (_) {
      return const LocationDetails(
        formattedAddress: 'Failed to fetch location details',
      );
    }
  }
}

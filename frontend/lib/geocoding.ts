export interface LocationDetails {
  country?: string
  state?: string
  county?: string
  city?: string
  town?: string
  village?: string
  road?: string
  postcode?: string
  formattedAddress?: string
  neighborhood?: string
  sublocality?: string
  premise?: string
  locationName?: string
}

interface NominatimResponse {
  address?: {
    country?: string
    state?: string
    county?: string
    city?: string
    town?: string
    village?: string
    road?: string
    postcode?: string
    neighbourhood?: string
    suburb?: string
    hamlet?: string
    residential?: string
    house_number?: string
  }
  display_name?: string
}

export async function reverseGeocode(lat: number, lng: number): Promise<LocationDetails> {
  try {
    // Using Nominatim (OpenStreetMap) API for reverse geocoding - same as index.tsx
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          'User-Agent': 'GeoResolver',
          'Accept-Language': 'en'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: NominatimResponse = await response.json()
    
    if (!data.address) {
      return { 
        formattedAddress: data.display_name || 'Unknown location',
        country: '—',
        state: '—',
        county: '—',
        city: '—',
        town: '—',
        village: '—',
        road: '—',
        postcode: '—'
      }
    }

    const address = data.address

    // Extract detailed location information from Nominatim response
    const country = address.country || '—'
    const state = address.state || '—'
    const county = address.county || '—'
    const city = address.city || '—'
    const town = address.town || '—'
    const village = address.village || '—'
    const road = address.road || '—'
    const postcode = address.postcode || '—'

    // Enhanced area/neighborhood extraction
    const neighborhood = address.neighbourhood || address.suburb || address.residential || '—'
    const sublocality = address.hamlet || address.suburb || '—'
    
    // Build premise/location name from available data
    let locationName = '—'
    if (address.house_number && address.road) {
      locationName = `${address.house_number} ${address.road}`
    } else if (neighborhood !== '—') {
      locationName = neighborhood
    } else if (sublocality !== '—') {
      locationName = sublocality
    } else if (city !== '—') {
      locationName = city
    }

    return {
      country,
      state,
      county,
      city,
      town,
      village,
      road,
      postcode,
      formattedAddress: data.display_name || 'Unknown location',
      neighborhood,
      sublocality,
      premise: address.house_number ? `${address.house_number}` : '—',
      locationName
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return {
      country: '—',
      state: '—',
      county: '—',
      city: '—',
      town: '—',
      village: '—',
      road: '—',
      postcode: '—',
      formattedAddress: 'Failed to fetch location details'
    }
  }
}

export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`
}

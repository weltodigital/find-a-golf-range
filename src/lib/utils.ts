export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert city names to URL slugs for Australian cities
export function getCitySlugFromName(cityName: string): string {
  // Handle special cases for Australian cities
  switch (cityName.toLowerCase()) {
    case 'newcastle–maitland':
    case 'newcastle-maitland':
      return 'newcastlemaitland'
    case 'albury–wodonga':
    case 'albury-wodonga':
      return 'alburywodonga'
    case 'forster-tuncurry':
      return 'forster-tuncurry'
    case 'gold coast':
      return 'goldcoast'
    case 'sunshine coast':
      return 'sunshinecoast'
    case 'central coast':
      return 'centralcoast'
    case 'byron bay':
      return 'byron-bay'
    case 'port douglas':
      return 'port-douglas'
    case 'coffs harbour':
      return 'coffs-harbour'
    case 'port macquarie':
      return 'port-macquarie'
    case 'hervey bay':
      return 'hervey-bay'
    case 'wagga wagga':
      return 'wagga-wagga'
    case 'alice springs':
      return 'alice-springs'
    case 'mount gambier':
      return 'mount-gambier'
    case 'victor harbor':
      return 'victor-harbor'
    case 'murray bridge':
      return 'murray-bridge'
    case 'port augusta':
      return 'port-augusta'
    case 'port lincoln':
      return 'port-lincoln'
    case 'port pirie':
      return 'port-pirie'
    case 'broken hill':
      return 'broken-hill'
    case 'lakes entrance':
      return 'lakes-entrance'
    case 'swan hill':
      return 'swan-hill'
    case 'apollo bay':
      return 'apollo-bay'
    case 'new norfolk':
      return 'new-norfolk'
    case 'st helens':
      return 'st-helens'
    case 'mornington peninsula':
      return 'mornington-peninsula'
    case 'southern highlands':
      return 'southern-highlands'
    case 'port hedland':
      return 'port-hedland'
    case 'fraser coast':
      return 'fraser-coast'
    case 'mount isa':
      return 'mount-isa'
    case 'barossa valley':
      return 'barossa-valley'
    case 'latrobe valley':
      return 'latrobe-valley'
    default:
      return cityName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .trim()
  }
}
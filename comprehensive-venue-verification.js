const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jiwttpxqvllvkvepjyix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3R0cHhxdmxsdkt2ZXBqeWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTYzOTYsImV4cCI6MjA3ODI3MjM5Nn0.148Ql7sFERIG3Vc-tXVPcG8kAoNNf9S0yPtZeCNEVZ8'
);

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createVenueSlug(venueName) {
  return venueName
    .toLowerCase()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createCitySlug(cityName) {
  return cityName
    .toLowerCase()
    .replace(/\\s+/g, '-');
}

function isValidUKCoordinate(lat, lng) {
  return lat >= 49.9 && lat <= 61.0 && lng >= -8.0 && lng <= 2.0;
}

async function comprehensiveVenueVerification() {
  console.log('🔍 COMPREHENSIVE INDIVIDUAL VENUE PAGE VERIFICATION');
  console.log('='.repeat(70));

  try {
    const { data: venues, error } = await supabase
      .from('golf_ranges')
      .select('id, name, slug, city, address, latitude, longitude, phone, website')
      .contains('special_features', ['Indoor Simulator'])
      .order('city, name');

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`📊 Verifying ${venues.length} individual venue pages...\n`);

    let criticalIssues = [];
    let warningIssues = [];
    let venuesFixed = 0;
    let validVenues = 0;

    // Major city centers for distance reference
    const majorCities = {
      'London': { lat: 51.5074, lng: -0.1278 },
      'Birmingham': { lat: 52.4862, lng: -1.8904 },
      'Manchester': { lat: 53.4808, lng: -2.2426 }
    };

    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      const progress = `[${i + 1}/${venues.length}]`;

      console.log(`${progress} 📍 ${venue.name} (${venue.city})`);

      // Check coordinates
      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);

      if (!venue.latitude || !venue.longitude || isNaN(lat) || isNaN(lng)) {
        console.log('   ❌ CRITICAL: Missing or invalid coordinates');
        criticalIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: 'Missing coordinates - page will not load map',
          severity: 'critical'
        });
        continue;
      }

      if (!isValidUKCoordinate(lat, lng)) {
        console.log(`   ❌ CRITICAL: Coordinates outside UK (${lat}, ${lng})`);
        criticalIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Invalid UK coordinates: ${lat}, ${lng}`,
          severity: 'critical'
        });
        continue;
      }

      // Generate venue page URL
      const venueSlug = venue.slug || createVenueSlug(venue.name);
      const citySlug = createCitySlug(venue.city);
      const venueURL = `https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`;

      console.log(`   🔗 URL: ${venueURL}`);
      console.log(`   📍 Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);

      validVenues++;

      // Check coordinate precision
      const precision = (venue.latitude.toString().split('.')[1] || '').length;
      if (precision < 5) {
        console.log(`   ⚠️  Low precision (${precision} decimals) - map may be inaccurate`);
        warningIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Low coordinate precision (${precision} decimals)`,
          severity: 'warning',
          url: venueURL
        });
      }

      // Calculate distance to nearest major city for context
      const distances = Object.entries(majorCities).map(([city, coords]) => ({
        city,
        distance: calculateDistance(lat, lng, coords.lat, coords.lng)
      })).sort((a, b) => a.distance - b.distance);

      const nearestCity = distances[0];
      console.log(`   🌍 ${nearestCity.distance.toFixed(1)} miles from ${nearestCity.city}`);

      // Check for extremely far distances (possible coordinate errors)
      if (nearestCity.distance > 300) {
        console.log(`   ⚠️  Very far from major cities - verify coordinates`);
        warningIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Very far from major cities (${nearestCity.distance.toFixed(1)} miles)`,
          severity: 'warning',
          url: venueURL
        });
      }

      // Check for venues very close to each other in same city
      const sameCity = venues.filter(v =>
        v.city === venue.city &&
        v.id !== venue.id &&
        !isNaN(parseFloat(v.latitude)) &&
        !isNaN(parseFloat(v.longitude))
      );

      if (sameCity.length > 0) {
        let minDistance = Infinity;
        let closestVenue = null;

        sameCity.forEach(otherVenue => {
          const otherLat = parseFloat(otherVenue.latitude);
          const otherLng = parseFloat(otherVenue.longitude);
          const dist = calculateDistance(lat, lng, otherLat, otherLng);

          if (dist < minDistance) {
            minDistance = dist;
            closestVenue = otherVenue;
          }
        });

        if (minDistance < 0.01) {
          console.log(`   ⚠️  Very close to ${closestVenue.name} (${minDistance.toFixed(4)} miles)`);
          warningIssues.push({
            venue: venue.name,
            city: venue.city,
            issue: `Very close to ${closestVenue.name} - may cause map confusion`,
            severity: 'warning',
            url: venueURL
          });
        } else {
          console.log(`   ✅ Good separation from nearby venues (${minDistance.toFixed(2)} miles)`);
        }
      }

      // Quick venue data completeness check
      const dataIssues = [];
      if (!venue.address) dataIssues.push('missing address');
      if (!venue.phone && !venue.website) dataIssues.push('no contact info');

      if (dataIssues.length > 0) {
        console.log(`   ⚠️  Data issues: ${dataIssues.join(', ')}`);
        warningIssues.push({
          venue: venue.name,
          city: venue.city,
          issue: `Data completeness: ${dataIssues.join(', ')}`,
          severity: 'info',
          url: venueURL
        });
      }

      console.log('');

      // Add small delay to avoid overwhelming output
      if (i > 0 && i % 20 === 0) {
        console.log(`   ... processed ${i + 1}/${venues.length} venues ...\n`);
      }
    }

    // Final Analysis
    console.log('📊 COMPREHENSIVE VERIFICATION SUMMARY:');
    console.log('='.repeat(60));

    console.log(`Total venues verified: ${venues.length}`);
    console.log(`Valid venues: ${validVenues}`);
    console.log(`Critical issues: ${criticalIssues.length}`);
    console.log(`Warning issues: ${warningIssues.length}`);

    const healthScore = Math.round((validVenues / venues.length) * 100);
    console.log(`Overall health score: ${healthScore}%`);

    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES (Must Fix - Pages Won\'t Work):');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.venue} (${issue.city})`);
        console.log(`   Issue: ${issue.issue}`);
      });
    }

    if (warningIssues.length > 0) {
      console.log('\n⚠️  WARNING ISSUES (Should Fix For Better UX):');
      warningIssues.slice(0, 10).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.venue} (${issue.city})`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   URL: ${issue.url}`);
      });

      if (warningIssues.length > 10) {
        console.log(`   ... and ${warningIssues.length - 10} more warnings`);
      }
    }

    // Priority testing list
    console.log('\n🎯 PRIORITY VENUE PAGES FOR MANUAL TESTING:');
    console.log('Test these individual venue pages first:\n');

    const priorityCities = ['London', 'Manchester', 'Birmingham', 'Bristol', 'Leeds'];
    let testUrls = [];

    priorityCities.forEach(cityName => {
      const cityVenues = venues.filter(v =>
        v.city === cityName &&
        !isNaN(parseFloat(v.latitude)) &&
        !isNaN(parseFloat(v.longitude))
      );

      if (cityVenues.length > 0) {
        const venue = cityVenues[0];
        const venueSlug = venue.slug || createVenueSlug(venue.name);
        const citySlug = createCitySlug(venue.city);
        const url = `https://www.findagolfrange.com/simulators/uk/${citySlug}/${venueSlug}`;

        testUrls.push({
          venue: venue.name,
          city: venue.city,
          url: url,
          lat: parseFloat(venue.latitude),
          lng: parseFloat(venue.longitude)
        });
      }
    });

    testUrls.forEach((test, index) => {
      console.log(`${index + 1}. ${test.venue} (${test.city})`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Expected map center: ${test.lat.toFixed(4)}, ${test.lng.toFixed(4)}`);
      console.log('');
    });

    // Final assessment
    console.log('🔍 FINAL ASSESSMENT:');
    console.log('='.repeat(50));

    if (healthScore >= 98 && criticalIssues.length === 0) {
      console.log('🎉 EXCELLENT: All individual venue pages should work correctly!');
      console.log('   • Maps will display accurate locations');
      console.log('   • Distance calculations will be precise');
      console.log('   • All venue pages should load properly');
    } else if (healthScore >= 95) {
      console.log('👍 VERY GOOD: Most venue pages working correctly');
      if (criticalIssues.length > 0) {
        console.log(`   • Fix ${criticalIssues.length} critical issues first`);
      }
      console.log('   • Minor improvements needed for perfection');
    } else {
      console.log('⚠️  NEEDS ATTENTION: Multiple venue page issues detected');
      console.log(`   • ${criticalIssues.length} venues have critical problems`);
      console.log(`   • ${warningIssues.length} venues need improvements`);
      console.log('   • Systematic fixes required');
    }

    console.log('\n📋 TESTING CHECKLIST:');
    console.log('For each priority venue page above, verify:');
    console.log('□ Page loads without errors');
    console.log('□ Map displays and centers on correct location');
    console.log('□ Venue marker appears in right position');
    console.log('□ Distance calculations are accurate');
    console.log('□ All venue details display correctly');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

comprehensiveVenueVerification().catch(console.error);
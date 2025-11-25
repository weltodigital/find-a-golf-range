// Location-specific content generation for SEO optimization
export interface LocationInfo {
  city: string
  county: string
  region: string
  population?: string
  keyLandmarks?: string[]
  golfCulture?: string
  transportLinks?: string[]
  nearbyAreas?: string[]
}

export function generateLocationContent(locationInfo: LocationInfo, rangeCount: number, totalBays: number) {
  const { city, county, region, population, keyLandmarks, golfCulture, transportLinks, nearbyAreas } = locationInfo

  return {
    heroTitle: `Golf Driving Ranges in ${city}`,
    heroSubtitle: `Discover ${rangeCount} premium golf practice facilities in ${city}, ${county}. Find the perfect driving range near you with detailed information, opening hours, and pricing.`,

    metaTitle: `${city} Golf Driving Ranges - ${rangeCount} Best Practice Facilities Near You`,
    metaDescription: `Find the best golf driving ranges in ${city}, ${county}. Browse ${rangeCount} top-rated practice facilities with ${totalBays}+ bays total. Book your golf practice session today.`,

    introContent: {
      heading: `Why Choose ${city} for Golf Practice?`,
      paragraphs: [
        `${city} stands out as an exceptional destination for golf practice in ${county}. With ${rangeCount} carefully selected driving ranges across the area, golfers of all skill levels can find the perfect facility to improve their game. Whether you're a beginner taking your first swings or a seasoned player fine-tuning your technique, ${city}'s diverse range of practice facilities caters to every need.`,

        `Our comprehensive directory features ${rangeCount} driving ranges in ${city}, offering a combined total of ${totalBays}+ practice bays. From state-of-the-art facilities with cutting-edge technology like Toptracer to traditional ranges with a focus on fundamentals, ${city} provides an unmatched variety of golf practice environments.`,

        population ? `As ${population}, ${city} has developed a thriving golf community that supports both recreational and competitive players. The city's driving ranges reflect this commitment to golf excellence, offering professional instruction, modern facilities, and welcoming environments for golfers at every stage of their journey.` :
        `${city} has cultivated a vibrant golf community that welcomes players of all abilities. The area's driving ranges are known for their professional standards, modern amenities, and commitment to helping golfers achieve their goals.`
      ]
    },

    whyChooseSection: {
      heading: `What Makes ${city} Golf Ranges Special?`,
      benefits: [
        {
          title: "Diverse Facility Options",
          description: `Choose from ${rangeCount} different driving ranges, each offering unique features and specialties to match your practice preferences.`,
          icon: "🏌️"
        },
        {
          title: "Professional Instruction",
          description: `Many ${city} ranges offer PGA-qualified professionals who can help accelerate your golf improvement through expert coaching and guidance.`,
          icon: "👨‍🏫"
        },
        {
          title: "Modern Technology",
          description: `Experience the latest in golf practice technology, including ball tracking systems, distance measurement, and interactive training aids.`,
          icon: "📊"
        },
        {
          title: "Convenient Locations",
          description: transportLinks ? `Easily accessible via ${transportLinks.join(', ')}, making it simple to fit golf practice into your schedule.` :
          `Strategically located throughout ${city} for convenient access from any part of the area.`,
          icon: "📍"
        }
      ]
    },

    localInfoSection: {
      heading: `Golf Practice in ${city}: Local Insights`,
      content: [
        keyLandmarks ? `Located ${keyLandmarks.length > 1 ? 'near' : 'close to'} ${keyLandmarks.slice(0, 3).join(', ')}, ${city}'s golf ranges benefit from ${city === 'London' ? 'the capital\'s' : 'the area\'s'} excellent connectivity and accessibility.` : null,

        golfCulture || `${city} has embraced golf as both a recreational activity and a serious sport. The local golf community is known for its welcoming atmosphere and commitment to supporting players at every level.`,

        nearbyAreas ? `${city} serves golfers not only from the city center but also from nearby areas including ${nearbyAreas.slice(0, 3).join(', ')}, making it a regional hub for golf practice and improvement.` : null,

        `The driving ranges in ${city} are designed to accommodate busy schedules, with many offering extended hours, covered bays for year-round practice, and flexible pricing options to suit different budgets and practice needs.`
      ].filter(Boolean)
    },

    practiceGuideSection: {
      heading: `Your Guide to Golf Practice in ${city}`,
      tips: [
        {
          number: 1,
          title: "Choose Your Location",
          content: `With ${rangeCount} ranges across ${city}, consider factors like proximity to your home or work, available facilities, and practice environment preferences.`
        },
        {
          number: 2,
          title: "Check Facility Features",
          content: `Review each range's specific amenities such as covered bays, putting greens, short game areas, and professional coaching services to find your ideal practice setup.`
        },
        {
          number: 3,
          title: "Consider Timing",
          content: `Many ${city} ranges offer different pricing for peak and off-peak hours. Check opening times and consider early morning or evening sessions for better value.`
        },
        {
          number: 4,
          title: "Book Lessons",
          content: `Take advantage of professional instruction available at many ${city} ranges. Expert coaching can dramatically accelerate your improvement and help you avoid developing bad habits.`
        }
      ]
    },

    callToActionSection: {
      heading: `Start Your Golf Journey in ${city} Today`,
      content: `Ready to improve your golf game? Explore our complete directory of ${rangeCount} driving ranges in ${city} and find the perfect practice facility for your needs. Each listing includes detailed information about facilities, pricing, opening hours, and contact details to help you make the best choice.`,
      buttonText: `Browse All ${city} Golf Ranges`
    },

    faqSection: {
      heading: `Frequently Asked Questions About Golf Ranges in ${city}`,
      questions: [
        {
          question: `How many golf driving ranges are there in ${city}?`,
          answer: `Our directory includes ${rangeCount} golf driving ranges in ${city}, offering a total of ${totalBays}+ practice bays across various locations throughout the area.`
        },
        {
          question: `What types of facilities can I find at ${city} golf ranges?`,
          answer: `${city} golf ranges offer diverse facilities including covered and open-air bays, putting greens, short game areas, professional coaching, club hire, and modern technology like ball tracking systems.`
        },
        {
          question: `Are golf lessons available at ${city} driving ranges?`,
          answer: `Yes, many driving ranges in ${city} offer professional golf instruction from PGA-qualified coaches, ranging from beginner lessons to advanced technique refinement.`
        },
        {
          question: `What are typical opening hours for golf ranges in ${city}?`,
          answer: `Most ${city} golf ranges operate from early morning (typically 7-8 AM) until evening (8-10 PM), with many offering extended hours during summer months and floodlit facilities for evening practice.`
        },
        {
          question: `How much does it cost to practice at a golf range in ${city}?`,
          answer: `Prices vary across ${city} golf ranges, typically ranging from £5-£20 depending on the number of balls, time of day, and facility quality. Many ranges offer discounted rates for regular visitors.`
        }
      ]
    }
  }
}

// Predefined location information for major UK cities
export const locationData: Record<string, LocationInfo> = {
  "London": {
    city: "London",
    county: "Greater London",
    region: "London",
    population: "a city of over 9 million people",
    keyLandmarks: ["Hyde Park", "The Thames", "Greenwich", "Hampstead Heath"],
    golfCulture: "London's golf scene is incredibly diverse, reflecting the capital's cosmopolitan nature. From historic clubs to modern practice facilities, the city offers unparalleled variety for golf enthusiasts.",
    transportLinks: ["Underground", "bus routes", "National Rail services"],
    nearbyAreas: ["Surrey", "Kent", "Essex", "Hertfordshire"]
  },
  "Manchester": {
    city: "Manchester",
    county: "Greater Manchester",
    region: "North West England",
    population: "a metropolitan area of over 2.7 million people",
    keyLandmarks: ["Manchester City Centre", "MediaCity", "Trafford Park"],
    golfCulture: "Manchester has a strong golfing tradition, with the region producing many professional players and hosting numerous golf events throughout the year.",
    transportLinks: ["Metrolink tram system", "extensive bus network", "rail connections"],
    nearbyAreas: ["Trafford", "Stockport", "Oldham", "Bolton"]
  },
  "Glasgow": {
    city: "Glasgow",
    county: "Glasgow City",
    region: "Scotland",
    population: "Scotland's largest city with over 635,000 residents",
    keyLandmarks: ["River Clyde", "Glasgow Green", "West End", "City Centre"],
    golfCulture: "Glasgow sits at the heart of Scotland's golf heritage, where the sport was first developed. The city maintains this proud tradition with excellent practice facilities and strong community support.",
    transportLinks: ["Glasgow Subway", "comprehensive bus services", "rail network"],
    nearbyAreas: ["East Renfrewshire", "South Lanarkshire", "Renfrewshire"]
  },
  "Birmingham": {
    city: "Birmingham",
    county: "West Midlands",
    region: "West Midlands",
    population: "the UK's second-largest city with over 1.1 million residents",
    keyLandmarks: ["Birmingham City Centre", "Jewellery Quarter", "Digbeth", "Edgbaston"],
    transportLinks: ["extensive bus network", "rail services", "tram connections"],
    nearbyAreas: ["Solihull", "Dudley", "Walsall", "Wolverhampton"]
  },
  "Leeds": {
    city: "Leeds",
    county: "West Yorkshire",
    region: "Yorkshire and the Humber",
    keyLandmarks: ["Leeds City Centre", "Roundhay Park", "Headingley"],
    transportLinks: ["bus services", "rail connections"],
    nearbyAreas: ["Bradford", "Wakefield", "Harrogate"]
  },
  "Liverpool": {
    city: "Liverpool",
    county: "Merseyside",
    region: "North West England",
    keyLandmarks: ["Albert Dock", "Cavern Quarter", "Liverpool One"],
    transportLinks: ["Merseyrail", "bus network"],
    nearbyAreas: ["Wirral", "St Helens", "Knowsley"]
  },
  "Edinburgh": {
    city: "Edinburgh",
    county: "City of Edinburgh",
    region: "Scotland",
    keyLandmarks: ["Edinburgh Castle", "Royal Mile", "Arthur's Seat", "Princes Street"],
    golfCulture: "As Scotland's capital, Edinburgh is deeply connected to golf's origins and maintains world-class practice facilities alongside its historic courses.",
    transportLinks: ["Lothian Buses", "tram network", "rail services"],
    nearbyAreas: ["East Lothian", "West Lothian", "Midlothian"]
  },
  "Bristol": {
    city: "Bristol",
    county: "Bristol",
    region: "South West England",
    keyLandmarks: ["Clifton Suspension Bridge", "Bristol Harbour", "Park Street"],
    transportLinks: ["bus services", "rail connections"],
    nearbyAreas: ["Bath", "South Gloucestershire", "North Somerset"]
  }
}
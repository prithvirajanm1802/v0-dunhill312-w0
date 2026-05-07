// Brand logos and color configurations
export const brandLogos = {
  // Telecom Operators
  jio: {
    name: "Jio",
    color: "#0066FF",
    emoji: "📱",
    description: "Reliance Jio - Mobile & Broadband",
  },
  airtel: {
    name: "Airtel",
    color: "#EF1D25",
    emoji: "📡",
    description: "Bharti Airtel - Mobile & DTH",
  },
  vi: {
    name: "VI",
    color: "#E60000",
    emoji: "📲",
    description: "Vodafone Idea - Mobile Networks",
  },
  bsnl: {
    name: "BSNL",
    color: "#FF6B00",
    emoji: "📞",
    description: "BSNL - Government Telecom",
  },

  // Travel & Ticketing
  irctc: {
    name: "IRCTC",
    color: "#0033A0",
    emoji: "🚂",
    description: "Indian Railways - Train Booking",
  },
  makemytrip: {
    name: "MakeMyTrip",
    color: "#003580",
    emoji: "✈️",
    description: "Travel & Holiday Packages",
  },

  // Movies & Entertainment
  bookmyshow: {
    name: "BookMyShow",
    color: "#FFB800",
    emoji: "🎬",
    description: "Movie & Event Tickets",
  },
  movietickets: {
    name: "Movie Tickets",
    color: "#FF1493",
    emoji: "🎭",
    description: "Movie Hall Bookings",
  },
  paytmmovies: {
    name: "Paytm Movies",
    color: "#0066FF",
    emoji: "🎥",
    description: "Paytm Movie Tickets",
  },
  netflix: {
    name: "Netflix",
    color: "#E50914",
    emoji: "📺",
    description: "Streaming Entertainment",
  },
  spotify: {
    name: "Spotify",
    color: "#1DB954",
    emoji: "🎵",
    description: "Music Streaming",
  },

  // Investment & Crypto
  bitcoin: {
    name: "Bitcoin",
    color: "#F7931A",
    emoji: "₿",
    description: "Cryptocurrency Investment",
  },
  groww: {
    name: "Groww",
    color: "#00C389",
    emoji: "📈",
    description: "Stock & Mutual Fund Investing",
  },
  coinswitch: {
    name: "CoinSwitch",
    color: "#6C5CE7",
    emoji: "💱",
    description: "Cryptocurrency Trading",
  },

  // Digital Services
  googleplay: {
    name: "Google Play",
    color: "#3DDC84",
    emoji: "🎮",
    description: "Google Play Store",
  },

  // E-commerce
  amazon: {
    name: "Amazon",
    color: "#FF9900",
    emoji: "🛒",
    description: "Amazon Shopping",
  },
  flipkart: {
    name: "Flipkart",
    color: "#1F54DA",
    emoji: "🛍️",
    description: "Flipkart E-commerce",
  },
  myntra: {
    name: "Myntra",
    color: "#009FDF",
    emoji: "👗",
    description: "Fashion & Lifestyle",
  },

  // Food
  zomato: {
    name: "Zomato",
    color: "#E64D3D",
    emoji: "🍔",
    description: "Food Delivery",
  },
  swiggy: {
    name: "Swiggy",
    color: "#FA4A3D",
    emoji: "🍕",
    description: "Food Delivery Platform",
  },

  // Utilities
  electricity: {
    name: "Electricity",
    color: "#FFA500",
    emoji: "💡",
    description: "Electricity Bill Payment",
  },
  water: {
    name: "Water",
    color: "#0088FF",
    emoji: "💧",
    description: "Water Bill Payment",
  },
}

export function getBrandLogo(brandId: string) {
  return brandLogos[brandId as keyof typeof brandLogos]
}

export function getAllBrands() {
  return Object.entries(brandLogos).map(([id, brand]) => ({
    id,
    ...brand,
  }))
}

export const categoryBrands = {
  telecom: ["jio", "airtel", "vi", "bsnl"],
  travel: ["irctc", "makemytrip"],
  entertainment: ["bookmyshow", "movietickets", "paytmmovies", "netflix", "spotify"],
  investment: ["bitcoin", "groww", "coinswitch"],
  apps: ["googleplay"],
  ecommerce: ["amazon", "flipkart", "myntra"],
  food: ["zomato", "swiggy"],
  utilities: ["electricity", "water"],
}

// Service integration configuration with brand logos and metadata
export interface ServiceConfig {
  id: string
  name: string
  category: "telecom" | "travel" | "entertainment" | "investment" | "apps" | "utilities"
  description: string
  icon: string
  logo: string
  color: string
  path: string
  providers?: string[]
  features: string[]
  status: "active" | "beta" | "coming-soon"
}

export const serviceIntegrations: Record<string, ServiceConfig> = {
  // Telecom Operators
  jio: {
    id: "jio",
    name: "Jio",
    category: "telecom",
    description: "Jio Mobile & Broadband Recharge",
    icon: "📱",
    logo: "/logos/jio.png",
    color: "#0066FF",
    path: "/services/jio",
    providers: ["Jio Mobile", "Jio Fiber", "Jio Air"],
    features: ["Mobile Recharge", "Broadband Recharge", "Instant Activation"],
    status: "active",
  },
  airtel: {
    id: "airtel",
    name: "Airtel",
    category: "telecom",
    description: "Airtel Mobile & DTH Services",
    icon: "📡",
    logo: "/logos/airtel.png",
    color: "#EF1D25",
    path: "/services/airtel",
    providers: ["Airtel Mobile", "Airtel Broadband", "Airtel Digital TV"],
    features: ["Mobile Recharge", "DTH Recharge", "Broadband Payment"],
    status: "active",
  },
  vi: {
    id: "vi",
    name: "VI",
    category: "telecom",
    description: "Vodafone Idea Mobile Recharge",
    icon: "📲",
    logo: "/logos/vi.png",
    color: "#E60000",
    path: "/services/vi",
    providers: ["VI Mobile", "VI Broadband"],
    features: ["Mobile Recharge", "Data Plans", "Postpaid Bills"],
    status: "active",
  },
  bsnl: {
    id: "bsnl",
    name: "BSNL",
    category: "telecom",
    description: "BSNL Mobile & Broadband",
    icon: "📞",
    logo: "/logos/bsnl.png",
    color: "#FF6B00",
    path: "/services/bsnl",
    providers: ["BSNL Mobile", "BSNL Broadband", "BSNL Landline"],
    features: ["Mobile Recharge", "Broadband Payment", "Landline Billing"],
    status: "active",
  },

  // Travel & Ticketing
  irctc: {
    id: "irctc",
    name: "IRCTC",
    category: "travel",
    description: "Book Train Tickets Online",
    icon: "🚂",
    logo: "/logos/irctc.png",
    color: "#0033A0",
    path: "/services/irctc",
    providers: ["Trains", "Hotels", "Holidays"],
    features: ["Book Tickets", "Check Status", "Instant Booking"],
    status: "active",
  },
  makemytrip: {
    id: "makemytrip",
    name: "MakeMyTrip",
    category: "travel",
    description: "Flights, Hotels & Holiday Packages",
    icon: "✈️",
    logo: "/logos/makemytrip.png",
    color: "#003580",
    path: "/services/makemytrip",
    providers: ["Flights", "Hotels", "Packages"],
    features: ["Book Flights", "Hotel Reservations", "Vacation Packages"],
    status: "active",
  },

  // Entertainment & Movies
  bookmyshow: {
    id: "bookmyshow",
    name: "BookMyShow",
    category: "entertainment",
    description: "Book Movie Tickets & Events",
    icon: "🎬",
    logo: "/logos/bookmyshow.png",
    color: "#FFB800",
    path: "/services/bookmyshow",
    providers: ["Movies", "Sports", "Events", "Plays"],
    features: ["Movie Tickets", "Event Booking", "Live Shows"],
    status: "active",
  },
  movietickets: {
    id: "movietickets",
    name: "Movie Tickets",
    category: "entertainment",
    description: "Movie Ticket Booking Platform",
    icon: "🎭",
    logo: "/logos/movietickets.png",
    color: "#FF1493",
    path: "/services/movie-tickets",
    providers: ["Movie Halls", "Premium Shows", "IMAX"],
    features: ["Easy Booking", "Discounts", "Seat Selection"],
    status: "active",
  },
  paytmmovies: {
    id: "paytmmovies",
    name: "Paytm Movies",
    category: "entertainment",
    description: "Movie Tickets via Paytm",
    icon: "🎥",
    logo: "/logos/paytm-movies.png",
    color: "#0066FF",
    path: "/services/paytm-movies",
    providers: ["Movie Tickets", "Events"],
    features: ["Instant Booking", "Cashback", "Group Bookings"],
    status: "active",
  },

  // Investment & Crypto
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin Investment",
    category: "investment",
    description: "Buy & Sell Bitcoin & Cryptocurrencies",
    icon: "₿",
    logo: "/logos/bitcoin.png",
    color: "#F7931A",
    path: "/services/bitcoin",
    providers: ["Bitcoin", "Ethereum", "Other Crypto"],
    features: ["Buy Crypto", "Sell Crypto", "Track Price", "Secure Wallet"],
    status: "active",
  },
  groww: {
    id: "groww",
    name: "Groww",
    category: "investment",
    description: "Stocks, Mutual Funds & IPO Investment",
    icon: "📈",
    logo: "/logos/groww.png",
    color: "#00C389",
    path: "/services/groww",
    providers: ["Stocks", "Mutual Funds", "IPO", "ETF"],
    features: ["Invest Stocks", "Mutual Funds", "Zero Brokerage", "IPO Access"],
    status: "active",
  },
  coinswitch: {
    id: "coinswitch",
    name: "CoinSwitch Kuber",
    category: "investment",
    description: "Cryptocurrency Trading Platform",
    icon: "💱",
    logo: "/logos/coinswitch.png",
    color: "#6C5CE7",
    path: "/services/coinswitch",
    providers: ["Crypto", "Trading", "Staking"],
    features: ["Instant Trading", "Low Fees", "Secure Wallet"],
    status: "active",
  },

  // Digital Services
  googleplay: {
    id: "googleplay",
    name: "Google Play",
    category: "apps",
    description: "Google Play Store Recharge & Gift Cards",
    icon: "🎮",
    logo: "/logos/googleplay.png",
    color: "#3DDC84",
    path: "/services/google-play",
    providers: ["Google Play Balance", "App Credits", "Game Recharge"],
    features: ["Instant Recharge", "Gift Cards", "App Purchase"],
    status: "active",
  },
  netflix: {
    id: "netflix",
    name: "Netflix",
    category: "apps",
    description: "Netflix Subscription Plans",
    icon: "📺",
    logo: "/logos/netflix.png",
    color: "#E50914",
    path: "/services/netflix",
    providers: ["Basic", "Standard", "Premium"],
    features: ["Subscribe", "Manage Plan", "Easy Payment"],
    status: "active",
  },
  spotify: {
    id: "spotify",
    name: "Spotify",
    category: "apps",
    description: "Spotify Premium Subscription",
    icon: "🎵",
    logo: "/logos/spotify.png",
    color: "#1DB954",
    path: "/services/spotify",
    providers: ["Individual", "Family", "Student"],
    features: ["Premium Subscription", "Ad-free", "Offline Download"],
    status: "active",
  },

  // Utilities
  electricity: {
    id: "electricity",
    name: "Electricity Bill",
    category: "utilities",
    description: "Pay Electricity Bills",
    icon: "💡",
    logo: "/logos/electricity.png",
    color: "#FFA500",
    path: "/services/electricity",
    providers: ["Bescom", "MSEB", "TNEB", "WBSEDCL"],
    features: ["Pay Bills", "View History", "Instant Payment"],
    status: "active",
  },
  water: {
    id: "water",
    name: "Water Bill",
    category: "utilities",
    description: "Pay Water Bills",
    icon: "💧",
    logo: "/logos/water.png",
    color: "#0088FF",
    path: "/services/water",
    providers: ["Municipal Board", "Water Department"],
    features: ["Bill Payment", "Check Arrears", "Auto Payment"],
    status: "active",
  },
}

export function getServicesByCategory(category: string): ServiceConfig[] {
  return Object.values(serviceIntegrations).filter((service) => service.category === category)
}

export function getServiceById(id: string): ServiceConfig | undefined {
  return serviceIntegrations[id]
}

export const categories = [
  { id: "telecom", name: "Mobile & Broadband", icon: "📱" },
  { id: "travel", name: "Travel & Tickets", icon: "✈️" },
  { id: "entertainment", name: "Movies & Events", icon: "🎬" },
  { id: "investment", name: "Investments & Crypto", icon: "📈" },
  { id: "apps", name: "Apps & Subscriptions", icon: "📲" },
  { id: "utilities", name: "Utilities & Bills", icon: "💡" },
]

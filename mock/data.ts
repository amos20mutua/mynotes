import type {
  Category,
  Conversation,
  DeliveryRequest,
  Message,
  Metric,
  Product,
  Review,
  Seller,
  Testimonial
} from "@/types";

export const categories: Category[] = [
  { id: "electronics", name: "Electronics", description: "Phones, audio, creators gear", accent: "from-cyan-400/30 to-blue-500/30" },
  { id: "fashion", name: "Style", description: "Sneakers, thrift gems, streetwear", accent: "from-amber-400/30 to-orange-500/30" },
  { id: "home", name: "Home", description: "Modern kitchen, decor, essentials", accent: "from-emerald-400/30 to-lime-500/30" },
  { id: "beauty", name: "Beauty", description: "Self-care, grooming, wellness", accent: "from-rose-400/30 to-pink-500/30" }
];

export const sellers: Seller[] = [
  {
    id: "seller-1",
    name: "Westlands Wave",
    slug: "westlands-wave",
    tagline: "Creator tech and city-ready accessories",
    verified: true,
    rating: 4.9,
    reviewsCount: 412,
    responseTime: "Replies in 4 mins",
    location: "Westlands",
    description: "Fast-moving electronics shop trusted by riders, creators, and startup teams across Nairobi.",
    logo: "WW",
    hero: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "seller-2",
    name: "Kilimani Edit",
    slug: "kilimani-edit",
    tagline: "Street-style pieces with premium curation",
    verified: true,
    rating: 4.8,
    reviewsCount: 268,
    responseTime: "Replies in 7 mins",
    location: "Kilimani",
    description: "A sharp fashion-led shop blending Nairobi nightlife taste with practical everyday wear.",
    logo: "KE",
    hero: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "seller-3",
    name: "CBD Supply House",
    slug: "cbd-supply-house",
    tagline: "Quick turnover essentials for city living",
    verified: false,
    rating: 4.6,
    reviewsCount: 194,
    responseTime: "Replies in 12 mins",
    location: "CBD",
    description: "Reliable inventory, transparent pricing, and same-day handoff options across major city routes.",
    logo: "CS",
    hero: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
  }
];

export const products: Product[] = [
  {
    id: "product-1",
    slug: "anker-soundcore-rush-mini",
    name: "Anker Soundcore Rush Mini",
    category: "electronics",
    description: "Portable speaker tuned for rooftop sessions, office desks, and matatu commutes. Strong bass, dependable battery, and a finish that feels more premium than its price suggests.",
    shortDescription: "Compact city speaker with deep bass and 12-hour battery.",
    price: 7200,
    compareAtPrice: 8500,
    sellerId: "seller-1",
    stock: 18,
    rating: 4.8,
    reviewsCount: 123,
    location: "Westlands",
    availability: "In stock",
    badges: ["Popular now", "Seen today"],
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=1200&q=80"
    ],
    specs: [
      { label: "Battery", value: "12 hours" },
      { label: "Connection", value: "Bluetooth 5.3" },
      { label: "Warranty", value: "6 months" }
    ],
    seenToday: 51,
    popularity: 94,
    createdAt: "2026-03-18"
  },
  {
    id: "product-2",
    slug: "kilimani-night-runner",
    name: "Kilimani Night Runner",
    category: "fashion",
    description: "Low-profile sneaker built for long city days and quick evening plans. Cushioned sole, reflective trim, and a silhouette that fits Nairobi's polished streetwear scene.",
    shortDescription: "Reflective urban sneaker with all-day comfort.",
    price: 9800,
    compareAtPrice: 11200,
    sellerId: "seller-2",
    stock: 7,
    rating: 4.9,
    reviewsCount: 89,
    location: "Kilimani",
    availability: "Low stock",
    badges: ["New arrival"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80"
    ],
    specs: [
      { label: "Upper", value: "Mesh + suede" },
      { label: "Sizes", value: "39-45" },
      { label: "Drop", value: "Same day" }
    ],
    seenToday: 28,
    popularity: 87,
    createdAt: "2026-03-20"
  },
  {
    id: "product-3",
    slug: "cbd-smart-kettle-pro",
    name: "CBD Smart Kettle Pro",
    category: "home",
    description: "A clean-lined electric kettle with temperature presets for coffee, green tea, and baby formula. Practical enough for apartments and polished enough for gifting.",
    shortDescription: "Fast-boil kettle with precision temperature presets.",
    price: 5600,
    sellerId: "seller-3",
    stock: 24,
    rating: 4.6,
    reviewsCount: 61,
    location: "CBD",
    availability: "In stock",
    badges: ["Trust pick"],
    image: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80"
    ],
    specs: [
      { label: "Capacity", value: "1.7L" },
      { label: "Finish", value: "Matte steel" },
      { label: "Power", value: "2200W" }
    ],
    seenToday: 19,
    popularity: 71,
    createdAt: "2026-03-11"
  },
  {
    id: "product-4",
    slug: "nairobi-glow-serum",
    name: "Nairobi Glow Serum",
    category: "beauty",
    description: "Niacinamide-focused serum for brightening and calming skin under city weather. Light texture, polished packaging, and a loyal review trail.",
    shortDescription: "Brightening serum designed for daily city wear.",
    price: 3400,
    sellerId: "seller-3",
    stock: 12,
    rating: 4.7,
    reviewsCount: 140,
    location: "CBD",
    availability: "In stock",
    badges: ["Popular now"],
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=80"
    ],
    specs: [
      { label: "Size", value: "30ml" },
      { label: "Skin Type", value: "All" },
      { label: "Routine", value: "AM / PM" }
    ],
    seenToday: 37,
    popularity: 78,
    createdAt: "2026-03-16"
  }
];

export const reviews: Review[] = [
  { id: "review-1", productId: "product-1", author: "Akinyi", rating: 5, comment: "Delivery was same day and the sound quality feels way above the price.", createdAt: "2 hours ago" },
  { id: "review-2", productId: "product-1", author: "Otis", rating: 4, comment: "Seller answered quickly and the packaging was clean.", createdAt: "1 day ago" },
  { id: "review-3", productId: "product-2", author: "Shiko", rating: 5, comment: "Actually comfortable enough for a full day in town.", createdAt: "3 days ago" },
  { id: "review-4", productId: "product-3", author: "Brian", rating: 4, comment: "Looks premium on the kitchen counter and heats fast.", createdAt: "5 days ago" }
];

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    sellerId: "seller-1",
    buyerName: "Amani K.",
    productSlug: "anker-soundcore-rush-mini",
    unread: 2,
    lastMessage: "Can you do dropoff in South B this evening?",
    lastSeen: "2m ago"
  },
  {
    id: "conv-2",
    sellerId: "seller-2",
    buyerName: "Njeri W.",
    productSlug: "kilimani-night-runner",
    unread: 0,
    lastMessage: "Size 42 is available and I can share more photos.",
    lastSeen: "11m ago"
  }
];

export const messages: Message[] = [
  { id: "msg-1", conversationId: "conv-1", sender: "buyer", body: "Hi, is the speaker still sealed?", sentAt: "10:32" },
  { id: "msg-2", conversationId: "conv-1", sender: "seller", body: "Yes, sealed and comes with receipt.", sentAt: "10:34" },
  { id: "msg-3", conversationId: "conv-1", sender: "buyer", body: "Can you do dropoff in South B this evening?", sentAt: "10:35" },
  { id: "msg-4", conversationId: "conv-2", sender: "seller", body: "Size 42 is available and I can share more photos.", sentAt: "09:20" }
];

export const deliveryRequests: DeliveryRequest[] = [
  {
    id: "del-1",
    productSlug: "anker-soundcore-rush-mini",
    sellerId: "seller-1",
    buyerName: "Amani K.",
    dropoffArea: "South B",
    eta: "Today, 7:00 PM",
    fee: 450,
    status: "In Transit",
    notes: "Call on arrival. Office gate opposite the mini mart.",
    timeline: [
      { label: "Request submitted", time: "10:37", complete: true },
      { label: "Seller confirmed", time: "10:45", complete: true },
      { label: "Rider picked package", time: "11:15", complete: true },
      { label: "In transit", time: "11:42", complete: true },
      { label: "Delivered", time: "Pending", complete: false }
    ]
  },
  {
    id: "del-2",
    productSlug: "cbd-smart-kettle-pro",
    sellerId: "seller-3",
    buyerName: "Grace N.",
    dropoffArea: "Roysambu",
    eta: "Tomorrow, 11:00 AM",
    fee: 620,
    status: "Confirmed",
    notes: "Need careful handling for gift wrap.",
    timeline: [
      { label: "Request submitted", time: "Yesterday", complete: true },
      { label: "Seller confirmed", time: "08:20", complete: true },
      { label: "Rider picked package", time: "Queued", complete: false },
      { label: "In transit", time: "Queued", complete: false },
      { label: "Delivered", time: "Queued", complete: false }
    ]
  }
];

export const testimonials: Testimonial[] = [
  {
    id: "test-1",
    name: "Mercy Otieno",
    role: "Buyer, Lavington",
    quote: "It feels like Nairobi's smartest shopping shortcut. I compare, chat, and sort delivery without opening five tabs."
  },
  {
    id: "test-2",
    name: "Kevin Maina",
    role: "Seller, Kilimani Edit",
    quote: "The product presentation feels premium enough for serious buyers, but the operations side is still practical and fast."
  },
  {
    id: "test-3",
    name: "Janet Wambui",
    role: "Operator, city dispatch",
    quote: "Delivery requests come through with the right context, so we don't lose time chasing basic details."
  }
];

export const metrics: Metric[] = [
  { label: "Active Nairobi sellers", value: "240+", detail: "Across Westlands, CBD, Kilimani, Ngara, Industrial Area" },
  { label: "Median seller reply time", value: "6 mins", detail: "Realtime chat designed for conversion" },
  { label: "City delivery coverage", value: "27 zones", detail: "Structured for dispatch, handoff, and trust" }
];

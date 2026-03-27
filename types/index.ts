export type Role = "buyer" | "seller" | "operator";

export type Category = {
  id: string;
  name: string;
  description: string;
  accent: string;
};

export type Seller = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  responseTime: string;
  location: string;
  description: string;
  logo: string;
  hero: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  sellerId: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  location: string;
  availability: "In stock" | "Low stock" | "Pre-order";
  badges: string[];
  image: string;
  gallery: string[];
  specs: { label: string; value: string }[];
  seenToday: number;
  popularity: number;
  createdAt: string;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  sellerId: string;
  buyerName: string;
  productSlug: string;
  unread: number;
  lastMessage: string;
  lastSeen: string;
};

export type Message = {
  id: string;
  conversationId: string;
  sender: "buyer" | "seller";
  body: string;
  sentAt: string;
};

export type DeliveryRequest = {
  id: string;
  productSlug: string;
  sellerId: string;
  buyerName: string;
  dropoffArea: string;
  eta: string;
  fee: number;
  status: "Pending" | "Confirmed" | "Picked" | "In Transit" | "Delivered";
  notes: string;
  timeline: { label: string; time: string; complete: boolean }[];
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  quote: string;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
};

export type VaultNoteStatus = "draft" | "active" | "archived";

export type VaultNote = {
  id: string;
  title: string;
  content: string;
  colorGroup: string;
  folder?: string;
  tags?: string[];
  isPinned?: boolean;
  status?: VaultNoteStatus;
  graphPosition?: {
    x: number;
    y: number;
    z?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type VaultLink = {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  createdAt: string;
};

export type VaultData = {
  notes: VaultNote[];
  links: VaultLink[];
};

import { categories, conversations, deliveryRequests, messages, products, reviews, sellers } from "@/mock/data";

export function getFeaturedProducts() {
  return products.slice(0, 4);
}

export function getTrendingProducts() {
  return [...products].sort((a, b) => b.popularity - a.popularity);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getSellerById(id: string) {
  return sellers.find((seller) => seller.id === id);
}

export function getRelatedProducts(category: string, currentSlug: string) {
  return products.filter((product) => product.category === category && product.slug !== currentSlug).slice(0, 3);
}

export function getReviewsForProduct(productId: string) {
  return reviews.filter((review) => review.productId === productId);
}

export function getSellerProducts(sellerId: string) {
  return products.filter((product) => product.sellerId === sellerId);
}

export function searchProducts(query?: string) {
  if (!query) return products;
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.location.toLowerCase().includes(lowerQuery)
  );
}

export function getMarketplaceData() {
  return {
    categories,
    sellers,
    products,
    conversations,
    messages,
    deliveryRequests
  };
}

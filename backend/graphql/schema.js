const { buildSchema } = require("graphql");

const schema = buildSchema(`
  type Address {
    id: ID
    label: String
    fullName: String
    phone: String
    line1: String
    line2: String
    city: String
    state: String
    postalCode: String
    country: String
    isDefault: Boolean
  }

  type User {
    id: ID!
    name: String
    email: String
    phone: String
    role: String
    isAdmin: Boolean
    isActive: Boolean
    addresses: [Address]
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    isActive: Boolean
    sortOrder: Int
  }

  type ProductVariant {
    id: ID
    label: String
    sku: String
    price: Float
    discountPrice: Float
    stock: Int
    weight: Float
    weightValue: Float
    weightUnit: String
  }

  type ProductDimensions {
    length: Float
    breadth: Float
    height: Float
  }

  type ProductAttribute {
    name: String
    value: String
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    sku: String
    brand: String
    category: Category
    subcategory: Category
    shortDescription: String
    description: String
    price: Float!
    discountPrice: Float
    stock: Int!
    inStock: Boolean!
    discountPercent: Int
    savingsAmount: Float
    weight: Float
    weightValue: Float
    weightUnit: String
    dimensions: ProductDimensions
    images: [String]!
    variants: [ProductVariant]
    attributes: [ProductAttribute]
    tags: [String]
    isFeatured: Boolean
    ratingsAverage: Float
    ratingsCount: Int
    createdAt: String
  }

  type ProductDetailResponse {
    product: Product
    related: [Product]
  }

  type CartItem {
    id: ID
    productId: ID!
    product: Product
    variantId: ID
    variantLabel: String
    quantity: Int!
    price: Float
    total: Float
  }

  type Cart {
    items: [CartItem]!
    subtotal: Float!
    deliveryFee: Float!
    total: Float!
    itemCount: Int!
  }

  type WishlistItem {
    id: ID
    product: Product!
    addedAt: String
  }

  type Wishlist {
    items: [WishlistItem]!
    itemCount: Int!
  }

  type NewsletterResult {
    success: Boolean!
    message: String!
    isAlreadySubscribed: Boolean
  }

  type StorefrontInitialData {
    me: User
    categories: [Category]!
    featuredProducts: [Product]!
    deals: [Product]!
    cart: Cart
    wishlist: Wishlist
    cacheSource: String
  }

  type Query {
    """
    Combined query for zero-waterfall, instant site opening in 1 request.
    Pulls user info, categories, bestsellers, deals, and user cart/wishlist.
    """
    storefrontInitial(limit: Int): StorefrontInitialData!

    """
    Fetch products with optional category, search, and featured filter.
    """
    products(
      category: String
      search: String
      featured: Boolean
      limit: Int
      skip: Int
    ): [Product]!

    """
    Fetch single product by slug or id along with related recommendations.
    """
    product(slug: String!): ProductDetailResponse

    """
    Fetch all active storefront categories.
    """
    categories(all: Boolean): [Category]!

    """
    Get authenticated user profile. Returns null if guest.
    """
    me: User

    """
    Get authenticated user cart. Returns empty cart for guests.
    """
    cart: Cart!

    """
    Get authenticated user wishlist. Returns empty wishlist for guests.
    """
    wishlist: Wishlist!

    """
    Search products by keyword.
    """
    searchProducts(query: String!, limit: Int): [Product]!
  }

  type Mutation {
    addToCart(
      productId: ID!
      variantId: ID
      variantLabel: String
      quantity: Int
    ): Cart!

    updateCartQuantity(
      productId: ID!
      variantId: ID
      quantity: Int!
    ): Cart!

    removeFromCart(
      productId: ID!
      variantId: ID
    ): Cart!

    clearCart: Cart!

    toggleWishlist(productId: ID!): Wishlist!

    subscribeNewsletter(
      email: String!
      source: String
    ): NewsletterResult!

    unsubscribeNewsletter(
      email: String!
    ): NewsletterResult!
  }
`);

module.exports = schema;

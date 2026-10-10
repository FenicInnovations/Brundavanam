export const STOREFRONT_INITIAL_QUERY = `
  query StorefrontInitial($limit: Int) {
    storefrontInitial(limit: $limit) {
      categories {
        id
        name
        slug
        description
        image
      }
      featuredProducts {
        id
        name
        slug
        price
        discountPrice
        discountPercent
        savingsAmount
        stock
        inStock
        images
        isFeatured
        ratingsAverage
        ratingsCount
        shortDescription
        category {
          id
          name
          slug
        }
        variants {
          id
          label
          price
          discountPrice
          stock
        }
      }
      deals {
        id
        name
        slug
        price
        discountPrice
        discountPercent
        savingsAmount
        images
        shortDescription
        inStock
        variants {
          id
          label
          price
          stock
        }
      }
      me {
        id
        name
        email
        phone
        role
        isAdmin
      }
      cart {
        itemCount
        subtotal
        total
      }
      wishlist {
        itemCount
      }
      cacheSource
    }
  }
`;

export const GET_PRODUCTS_QUERY = `
  query GetProducts(
    $category: String
    $search: String
    $featured: Boolean
    $limit: Int
    $skip: Int
  ) {
    products(
      category: $category
      search: $search
      featured: $featured
      limit: $limit
      skip: $skip
    ) {
      id
      name
      slug
      price
      discountPrice
      discountPercent
      savingsAmount
      stock
      inStock
      images
      isFeatured
      ratingsAverage
      ratingsCount
      shortDescription
      category {
        id
        name
        slug
      }
      variants {
        id
        label
        price
        stock
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG_QUERY = `
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      product {
        id
        name
        slug
        sku
        brand
        shortDescription
        description
        price
        discountPrice
        discountPercent
        savingsAmount
        stock
        inStock
        images
        isFeatured
        weight
        weightValue
        weightUnit
        ratingsAverage
        ratingsCount
        tags
        category {
          id
          name
          slug
        }
        variants {
          id
          label
          sku
          price
          discountPrice
          stock
          weight
          weightValue
          weightUnit
        }
        attributes {
          name
          value
        }
      }
      related {
        id
        name
        slug
        price
        discountPrice
        discountPercent
        images
        inStock
      }
    }
  }
`;

export const GET_CATEGORIES_QUERY = `
  query GetCategories($all: Boolean) {
    categories(all: $all) {
      id
      name
      slug
      description
      image
    }
  }
`;

export const ADD_TO_CART_MUTATION = `
  mutation AddToCart(
    $productId: ID!
    $variantId: ID
    $variantLabel: String
    $quantity: Int
  ) {
    addToCart(
      productId: $productId
      variantId: $variantId
      variantLabel: $variantLabel
      quantity: $quantity
    ) {
      itemCount
      subtotal
      deliveryFee
      total
      items {
        id
        productId
        variantId
        variantLabel
        quantity
        price
        total
        product {
          id
          name
          slug
          images
        }
      }
    }
  }
`;

export const TOGGLE_WISHLIST_MUTATION = `
  mutation ToggleWishlist($productId: ID!) {
    toggleWishlist(productId: $productId) {
      itemCount
      items {
        id
        product {
          id
          name
          slug
          price
          images
        }
      }
    }
  }
`;

export const SUBSCRIBE_NEWSLETTER_MUTATION = `
  mutation SubscribeNewsletter($email: String!, $source: String) {
    subscribeNewsletter(email: $email, source: $source) {
      success
      message
      isAlreadySubscribed
    }
  }
`;

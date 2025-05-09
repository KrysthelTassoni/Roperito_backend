CREATE DATABASE roperito;
\c roperito;
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Address table
CREATE TABLE address (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sizes table
CREATE TABLE sizes (
    id UUID PRIMARY KEY,
    name VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(150),
    description TEXT,
    price DECIMAL(10,2),
    category_id UUID NOT NULL,
    size_id UUID NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (size_id) REFERENCES sizes(id)
);

-- Product images table
CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    image_url TEXT,
    is_main BOOLEAN,
    "order" INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (user_id, product_id)
);

-- Ratings table
CREATE TABLE ratings (
    id UUID PRIMARY KEY,
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    value DECIMAL(2,1) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (buyer_id, seller_id)
);

-- Orders table
CREATE TABLE "order" (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

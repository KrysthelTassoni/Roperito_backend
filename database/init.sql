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

INSERT INTO categories (id, name)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Camisetas'),
    ('00000000-0000-0000-0000-000000000002', 'Pantalones'),
    ('00000000-0000-0000-0000-000000000003', 'Vestidos'),
    ('00000000-0000-0000-0000-000000000004', 'Calzado'),
    ('00000000-0000-0000-0000-000000000005', 'Accesorios');

-- Sizes table
CREATE TABLE sizes (
    id UUID PRIMARY KEY,
    name VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar tallas
INSERT INTO sizes (id, name)
VALUES 
    ('78b45085-8532-48f1-8265-8e68619d2637', 'XS'),
    ('0fb9034a-346e-4143-a060-d210f614fe64', 'S'),
    ('4c89f203-cde9-4947-8b8c-38dea6e04d6b', 'M'),
    ('375a0ec6-f96e-4901-907e-9402cbc7023a', 'L'),
    ('54ec78a6-b19b-41af-9fcf-753b9f31d949', 'XL');

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
CREATE TABLE orders (
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



-- ============================================================================
-- E-COMMERCE PHYSICAL SCHEMA (PostgreSQL)
-- Converted from: ecommerce-schema-erd.mmd
-- Conventions: snake_case, singular table names, id (UUID) as PK,
--              <table>_id as FK, is_/has_ booleans, _at timestamps
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. USER & ACCESS CONTROL DOMAIN
-- ============================================================================

CREATE TABLE user_account (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type       VARCHAR(20) NOT NULL DEFAULT 'customer'
                        CHECK (user_type IN ('customer','admin','staff')),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','suspended','deactivated')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ                          -- soft delete
);

-- Case-insensitive uniqueness on email, but only enforced for non-deleted users
CREATE UNIQUE INDEX uq_user_account_email
    ON user_account (LOWER(email))
    WHERE deleted_at IS NULL;

CREATE TABLE role (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    is_system       BOOLEAN NOT NULL DEFAULT false,       -- built-in roles: not user-editable
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_role_name ON role (name);

CREATE TABLE permission (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key             VARCHAR(150) NOT NULL,                -- e.g. 'orders.delete'
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_permission_key ON permission (key);

-- Junction: role <-> permission (M:N)
CREATE TABLE role_permission (
    role_id         UUID NOT NULL REFERENCES role(id)       ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
    -- CASCADE: a role_permission row is meaningless once either side is gone
);

-- Junction: user <-> role (M:N)
CREATE TABLE user_role (
    user_id         UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES role(id)         ON DELETE RESTRICT,
    assigned_by     UUID REFERENCES user_account(id)          ON DELETE SET NULL,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
    -- user_id CASCADE: role assignment is meaningless once the user is gone
    -- role_id RESTRICT: prevent deleting a role while it's still assigned to users
    -- assigned_by SET NULL: keep the assignment record even if the granting admin is deleted
);

CREATE INDEX ix_user_role_role_id ON user_role (role_id);

-- ============================================================================
-- 2. AUTH SUPPORT DOMAIN
-- ============================================================================

CREATE TABLE otp_verification (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    purpose         VARCHAR(30) NOT NULL
                        CHECK (purpose IN ('login','signup','password_reset','phone_verify')),
    otp_hash        VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    attempt_count   INT NOT NULL DEFAULT 0,
    max_attempts    INT NOT NULL DEFAULT 5,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','verified','expired','failed')),
    last_sent_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- CASCADE: an OTP has no meaning independent of the user requesting it
);

CREATE INDEX ix_otp_verification_user_id ON otp_verification (user_id);
CREATE INDEX ix_otp_verification_expires_at ON otp_verification (expires_at);

CREATE TABLE refresh_token (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    token_hash              VARCHAR(255) NOT NULL,
    family_id               UUID NOT NULL,                -- groups tokens from same login chain (rotation)
    expires_at              TIMESTAMPTZ NOT NULL,
    revoked_at              TIMESTAMPTZ,
    replaced_by_token_id    UUID REFERENCES refresh_token(id) ON DELETE SET NULL,  -- self-reference
    user_agent              VARCHAR(255),
    ip_address              VARCHAR(45),                  -- IPv6-safe length
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
    -- user_id CASCADE: tokens are worthless without the owning user
    -- replaced_by_token_id SET NULL: don't cascade-delete the whole rotation chain
);

CREATE INDEX ix_refresh_token_user_id ON refresh_token (user_id);
CREATE UNIQUE INDEX uq_refresh_token_hash ON refresh_token (token_hash);
CREATE INDEX ix_refresh_token_family_id ON refresh_token (family_id);

-- ============================================================================
-- 3. CATALOG DOMAIN
-- ============================================================================

CREATE TABLE category (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    slug            VARCHAR(170) NOT NULL,
    description     VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_category_slug ON category (slug);

CREATE TABLE product (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES category(id) ON DELETE SET NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    sku             VARCHAR(100) NOT NULL,
    price           DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive','out_of_stock')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
    -- category_id SET NULL: deleting a category shouldn't force-delete or block on its products;
    --   product simply becomes "uncategorized" (business decision — confirm with product team)
);

CREATE UNIQUE INDEX uq_product_sku ON product (sku);
CREATE INDEX ix_product_category_id ON product (category_id);

CREATE TABLE product_image (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    s3_key          VARCHAR(500) NOT NULL,
    url             VARCHAR(500) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- CASCADE: an image with no product is orphaned storage metadata, not useful data
);

CREATE INDEX ix_product_image_product_id ON product_image (product_id);

-- ============================================================================
-- 4. CART DOMAIN
-- ============================================================================

CREATE TABLE cart (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','converted','abandoned')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- CASCADE: a cart has no purpose independent of its owning user
);

CREATE INDEX ix_cart_user_id ON cart (user_id);

CREATE TABLE cart_item (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id         UUID NOT NULL REFERENCES cart(id)    ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    quantity        INT NOT NULL CHECK (quantity > 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- cart_id CASCADE: line item is meaningless without the cart
    -- product_id RESTRICT: prevent hard-deleting a product that's sitting in someone's active cart
    --   (product uses soft delete via deleted_at, so this mainly guards against admin hard-deletes)
);

CREATE INDEX ix_cart_item_cart_id ON cart_item (cart_id);
CREATE INDEX ix_cart_item_product_id ON cart_item (product_id);
CREATE UNIQUE INDEX uq_cart_item_cart_product ON cart_item (cart_id, product_id);  -- one row per product per cart

-- ============================================================================
-- 5. ORDER DOMAIN
-- ============================================================================

CREATE TABLE customer_order (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled','refunded')),
    subtotal            DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    total               DECIMAL(12,2) NOT NULL CHECK (total >= 0),
    idempotency_key     VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    -- RESTRICT: NEVER allow a user to be hard-deleted while order/financial history exists.
    --   User deletion flows must anonymize (see user_account soft delete) instead.
);
-- Note: table named customer_order, not order, because ORDER is a reserved SQL keyword

CREATE INDEX ix_customer_order_user_id ON customer_order (user_id);
CREATE UNIQUE INDEX uq_customer_order_idempotency_key
    ON customer_order (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE order_item (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES product(id) ON DELETE SET NULL,
    product_name    VARCHAR(255) NOT NULL,          -- snapshot at time of purchase
    sku             VARCHAR(100) NOT NULL,          -- snapshot at time of purchase
    unit_price      DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),  -- snapshot, not live product.price
    quantity        INT NOT NULL CHECK (quantity > 0),
    subtotal        DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- order_id CASCADE: line item is meaningless without the order
    -- product_id SET NULL: order history must survive product deletion — that's exactly
    --   why product_name/sku/unit_price are denormalized snapshots here (see earlier discussion
    --   on why "unit_price" lives on the line item, not the Product table)
);

CREATE INDEX ix_order_item_order_id ON order_item (order_id);
CREATE INDEX ix_order_item_product_id ON order_item (product_id);

CREATE TABLE invoice (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES customer_order(id) ON DELETE RESTRICT,
    invoice_number  VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'issued'
                        CHECK (status IN ('issued','paid','void')),
    s3_key          VARCHAR(500),
    url             VARCHAR(500),
    generated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- RESTRICT: invoices are financial/legal records — never lose them via cascade delete
);

CREATE UNIQUE INDEX uq_invoice_order_id ON invoice (order_id);        -- enforces the 1:1 with customer_order
CREATE UNIQUE INDEX uq_invoice_number ON invoice (invoice_number);

-- ============================================================================
-- 6. SUPPORTING / CROSS-CUTTING DOMAIN
-- ============================================================================

CREATE TABLE idempotency_key (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_value       VARCHAR(255) NOT NULL,
    user_id         UUID REFERENCES user_account(id) ON DELETE SET NULL,
    endpoint        VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress','completed','failed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL
    -- SET NULL: optional relationship in the diagram (user is nullable) — keep the
    --   idempotency record for debugging even if the user is later deleted
);

CREATE UNIQUE INDEX uq_idempotency_key_value_endpoint ON idempotency_key (key_value, endpoint);
CREATE INDEX ix_idempotency_key_expires_at ON idempotency_key (expires_at);

CREATE TABLE notification_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES user_account(id) ON DELETE SET NULL,
    channel                 VARCHAR(20) NOT NULL
                                CHECK (channel IN ('email','sms','push')),
    purpose                 VARCHAR(50) NOT NULL,
    recipient               VARCHAR(255) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'queued'
                                CHECK (status IN ('queued','sent','failed','delivered')),
    provider_message_id     VARCHAR(255),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
    -- SET NULL: notification logs are an audit trail — must survive user deletion
    --   for compliance/debugging, so we keep the row and just null the reference
);

CREATE INDEX ix_notification_log_user_id ON notification_log (user_id);
CREATE INDEX ix_notification_log_created_at ON notification_log (created_at);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

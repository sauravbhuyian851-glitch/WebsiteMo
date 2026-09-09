-- ============================================
-- WebsiteMo CMS — Database Schema
-- Mirrors WordPress relational model
-- ============================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL DEFAULT '',
    role            TEXT NOT NULL DEFAULT 'subscriber',
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_meta (
    meta_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meta_key    TEXT NOT NULL,
    meta_value  TEXT
);
CREATE INDEX IF NOT EXISTS idx_usermeta_user ON user_meta(user_id);
CREATE INDEX IF NOT EXISTS idx_usermeta_key ON user_meta(meta_key);

-- POSTS (posts, pages, attachments, revisions, nav_menu_items)
CREATE TABLE IF NOT EXISTS posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id       INTEGER NOT NULL REFERENCES users(id),
    post_type       TEXT NOT NULL DEFAULT 'post',
    post_status     TEXT NOT NULL DEFAULT 'draft',
    title           TEXT NOT NULL DEFAULT '',
    slug            TEXT NOT NULL DEFAULT '',
    content         TEXT NOT NULL DEFAULT '',
    excerpt         TEXT NOT NULL DEFAULT '',
    password        TEXT DEFAULT '',
    parent_id       INTEGER DEFAULT 0,
    menu_order      INTEGER DEFAULT 0,
    comment_status  TEXT NOT NULL DEFAULT 'open',
    ping_status     TEXT NOT NULL DEFAULT 'open',
    mime_type       TEXT DEFAULT '',
    guid            TEXT DEFAULT '',
    publish_date    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_type_status ON posts(post_type, post_status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

CREATE TABLE IF NOT EXISTS post_meta (
    meta_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    meta_key    TEXT NOT NULL,
    meta_value  TEXT
);
CREATE INDEX IF NOT EXISTS idx_postmeta_post ON post_meta(post_id);
CREATE INDEX IF NOT EXISTS idx_postmeta_key ON post_meta(meta_key);

-- TAXONOMIES
CREATE TABLE IF NOT EXISTS terms (
    term_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS term_taxonomy (
    term_taxonomy_id INTEGER PRIMARY KEY AUTOINCREMENT,
    term_id          INTEGER NOT NULL REFERENCES terms(term_id) ON DELETE CASCADE,
    taxonomy         TEXT NOT NULL DEFAULT 'category',
    description      TEXT DEFAULT '',
    parent           INTEGER DEFAULT 0,
    count            INTEGER DEFAULT 0,
    UNIQUE(term_id, taxonomy)
);
CREATE INDEX IF NOT EXISTS idx_termtax_taxonomy ON term_taxonomy(taxonomy);

CREATE TABLE IF NOT EXISTS term_relationships (
    object_id        INTEGER NOT NULL,
    term_taxonomy_id INTEGER NOT NULL REFERENCES term_taxonomy(term_taxonomy_id) ON DELETE CASCADE,
    term_order       INTEGER DEFAULT 0,
    PRIMARY KEY (object_id, term_taxonomy_id)
);

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
    comment_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id         INTEGER DEFAULT 0,
    author_name     TEXT NOT NULL DEFAULT '',
    author_email    TEXT NOT NULL DEFAULT '',
    author_url      TEXT DEFAULT '',
    author_ip       TEXT DEFAULT '',
    content         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    parent_id       INTEGER DEFAULT 0,
    user_agent      TEXT DEFAULT '',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE TABLE IF NOT EXISTS comment_meta (
    meta_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id  INTEGER NOT NULL REFERENCES comments(comment_id) ON DELETE CASCADE,
    meta_key    TEXT NOT NULL,
    meta_value  TEXT
);
CREATE INDEX IF NOT EXISTS idx_commentmeta_comment ON comment_meta(comment_id);

-- OPTIONS (Key-Value site settings)
CREATE TABLE IF NOT EXISTS options (
    option_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    option_name  TEXT NOT NULL UNIQUE,
    option_value TEXT NOT NULL DEFAULT '',
    autoload     TEXT NOT NULL DEFAULT 'yes'
);
CREATE INDEX IF NOT EXISTS idx_options_name ON options(option_name);

-- SESSIONS (password reset tokens, app passwords)
CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL DEFAULT 'reset',
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

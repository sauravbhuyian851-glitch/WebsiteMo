-- ============================================
-- WebsiteMo CMS — Seed Data
-- ============================================

-- Default options
INSERT OR IGNORE INTO options (option_name, option_value, autoload) VALUES
('site_title', 'WebsiteMo', 'yes'),
('site_tagline', 'Build Your Identity', 'yes'),
('site_url', 'http://localhost:3000', 'yes'),
('admin_email', 'admin@websitemo.com', 'yes'),
('users_can_register', '0', 'yes'),
('default_role', 'subscriber', 'yes'),
('timezone', 'UTC', 'yes'),
('date_format', 'F j, Y', 'yes'),
('time_format', 'g:i a', 'yes'),
('start_of_week', '1', 'yes'),
('language', 'en-US', 'yes'),
('default_category', '1', 'yes'),
('default_post_format', 'standard', 'yes'),
('posts_per_page', '10', 'yes'),
('show_on_front', 'posts', 'yes'),
('page_on_front', '0', 'yes'),
('page_for_posts', '0', 'yes'),
('rss_use_excerpt', '0', 'yes'),
('blog_public', '1', 'yes'),
('default_comment_status', 'open', 'yes'),
('require_comment_registration', '0', 'yes'),
('comment_moderation', '0', 'yes'),
('comments_per_page', '50', 'yes'),
('thread_comments', '1', 'yes'),
('thread_comments_depth', '5', 'yes'),
('show_avatars', '1', 'yes'),
('avatar_default', 'mystery', 'yes'),
('thumbnail_size_w', '150', 'yes'),
('thumbnail_size_h', '150', 'yes'),
('medium_size_w', '300', 'yes'),
('medium_size_h', '300', 'yes'),
('large_size_w', '1024', 'yes'),
('large_size_h', '1024', 'yes'),
('thumbnail_crop', '1', 'yes'),
('permalink_structure', 'post_name', 'yes'),
('uploads_use_yearmonth_folders', '1', 'yes'),
('active_theme', 'default', 'yes'),
('active_plugins', '[]', 'yes'),
('dashboard_widget_order', '[]', 'yes'),
('site_icon', '', 'yes'),
('site_logo', '', 'yes'),
('custom_css', '', 'yes');

-- Default "Uncategorized" category
INSERT OR IGNORE INTO terms (term_id, name, slug) VALUES (1, 'Uncategorized', 'uncategorized');
INSERT OR IGNORE INTO term_taxonomy (term_taxonomy_id, term_id, taxonomy, description, parent, count)
VALUES (1, 1, 'category', '', 0, 0);

-- Default "Hello World" post
INSERT OR IGNORE INTO posts (id, author_id, post_type, post_status, title, slug, content, excerpt, publish_date, comment_status)
VALUES (1, 1, 'post', 'publish', 'Hello World', 'hello-world',
'<p>Welcome to WebsiteMo CMS. This is your first post. Edit or delete it, then start writing!</p>',
'Welcome to WebsiteMo CMS.', CURRENT_TIMESTAMP, 'open');

-- Link post to default category
INSERT OR IGNORE INTO term_relationships (object_id, term_taxonomy_id, term_order)
VALUES (1, 1, 0);

-- Default "Sample Page"
INSERT OR IGNORE INTO posts (id, author_id, post_type, post_status, title, slug, content, excerpt, publish_date, comment_status)
VALUES (2, 1, 'page', 'publish', 'Sample Page', 'sample-page',
'<p>This is a sample page. It''s different from a post because it stays in one place.</p>',
'', CURRENT_TIMESTAMP, 'closed');

-- Default comment
INSERT OR IGNORE INTO comments (comment_id, post_id, user_id, author_name, author_email, content, status)
VALUES (1, 1, 0, 'A Commenter', 'commenter@example.com',
'Hi, this is a comment. To get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.', 'approved');

-- Update term count
UPDATE term_taxonomy SET count = 1 WHERE term_taxonomy_id = 1;

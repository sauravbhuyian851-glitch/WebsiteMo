/**
 * WebsiteMo CMS — Post Model
 */
const { query, queryOne, run } = require('../database/db');
const { slugify, uniqueSlug } = require('../utils/slugify');

const Post = {
  findById(id) {
    return queryOne('SELECT * FROM posts WHERE id = ?', [id]);
  },

  findBySlug(slug, postType = 'post') {
    return queryOne('SELECT * FROM posts WHERE slug = ? AND post_type = ?', [slug, postType]);
  },

  findAll({ page = 1, perPage = 10, postType = 'post', status, author, search, orderBy = 'created_at', order = 'DESC', excludeStatus } = {}) {
    let sql = 'SELECT p.*, u.display_name as author_name FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.post_type = ?';
    const params = [postType];

    if (status) {
      sql += ' AND p.post_status = ?';
      params.push(status);
    } else if (excludeStatus) {
      sql += ' AND p.post_status != ?';
      params.push(excludeStatus);
    }

    if (author) {
      sql += ' AND p.author_id = ?';
      params.push(author);
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    // Count
    const countSql = sql.replace(/^SELECT .+ FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = queryOne(countSql, params);
    const total = countResult ? countResult.count : 0;

    // Order
    const validColumns = ['title', 'created_at', 'updated_at', 'publish_date', 'menu_order'];
    const col = validColumns.includes(orderBy) ? orderBy : 'created_at';
    const dir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY p.${col} ${dir}`;

    // Paginate
    const offset = (page - 1) * perPage;
    sql += ' LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    const posts = query(sql, params);
    return { posts, total, page, perPage };
  },

  create(data) {
    const slug = uniqueSlug(data.slug || data.title || 'untitled', (s) => {
      return !!queryOne('SELECT id FROM posts WHERE slug = ? AND post_type = ?', [s, data.post_type || 'post']);
    });

    const result = run(
      `INSERT INTO posts (author_id, post_type, post_status, title, slug, content, excerpt, password, parent_id, menu_order, comment_status, ping_status, mime_type, guid, publish_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.author_id,
        data.post_type || 'post',
        data.post_status || 'draft',
        data.title || '',
        slug,
        data.content || '',
        data.excerpt || '',
        data.password || '',
        data.parent_id || 0,
        data.menu_order || 0,
        data.comment_status || 'open',
        data.ping_status || 'open',
        data.mime_type || '',
        data.guid || '',
        data.publish_date || null
      ]
    );
    return this.findById(result.lastInsertRowid);
  },

  update(id, data) {
    const fields = [];
    const params = [];

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.slug !== undefined) {
      const slug = uniqueSlug(data.slug, (s) => {
        const existing = queryOne('SELECT id FROM posts WHERE slug = ? AND id != ?', [s, id]);
        return !!existing;
      });
      fields.push('slug = ?');
      params.push(slug);
    }
    if (data.content !== undefined) { fields.push('content = ?'); params.push(data.content); }
    if (data.excerpt !== undefined) { fields.push('excerpt = ?'); params.push(data.excerpt); }
    if (data.post_status !== undefined) { fields.push('post_status = ?'); params.push(data.post_status); }
    if (data.password !== undefined) { fields.push('password = ?'); params.push(data.password); }
    if (data.parent_id !== undefined) { fields.push('parent_id = ?'); params.push(data.parent_id); }
    if (data.menu_order !== undefined) { fields.push('menu_order = ?'); params.push(data.menu_order); }
    if (data.comment_status !== undefined) { fields.push('comment_status = ?'); params.push(data.comment_status); }
    if (data.ping_status !== undefined) { fields.push('ping_status = ?'); params.push(data.ping_status); }
    if (data.publish_date !== undefined) { fields.push('publish_date = ?'); params.push(data.publish_date); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = datetime('now')");
    params.push(id);

    run(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  delete(id) {
    run('DELETE FROM posts WHERE id = ?', [id]);
  },

  moveToTrash(id) {
    return this.update(id, { post_status: 'trash' });
  },

  restore(id) {
    return this.update(id, { post_status: 'draft' });
  },

  // Revisions
  createRevision(postId, authorId) {
    const original = this.findById(postId);
    if (!original) return null;

    const result = run(
      `INSERT INTO posts (author_id, post_type, post_status, title, slug, content, excerpt, parent_id, publish_date)
       VALUES (?, 'revision', 'inherit', ?, ?, ?, ?, ?, datetime('now'))`,
      [authorId, original.title, original.slug + '-revision', original.content, original.excerpt, postId]
    );
    return result.lastInsertRowid;
  },

  getRevisions(postId) {
    return query(
      "SELECT r.*, u.display_name as author_name FROM posts r LEFT JOIN users u ON r.author_id = u.id WHERE r.parent_id = ? AND r.post_type = 'revision' ORDER BY r.created_at DESC",
      [postId]
    );
  },

  restoreRevision(postId, revisionId) {
    const revision = this.findById(revisionId);
    if (!revision || revision.parent_id !== postId) return null;
    return this.update(postId, {
      title: revision.title,
      content: revision.content,
      excerpt: revision.excerpt
    });
  },

  // Meta
  getMeta(postId, key) {
    if (key) {
      const row = queryOne('SELECT meta_value FROM post_meta WHERE post_id = ? AND meta_key = ?', [postId, key]);
      return row ? row.meta_value : null;
    }
    return query('SELECT meta_key, meta_value FROM post_meta WHERE post_id = ?', [postId]);
  },

  setMeta(postId, key, value) {
    const existing = queryOne('SELECT meta_id FROM post_meta WHERE post_id = ? AND meta_key = ?', [postId, key]);
    if (existing) {
      run('UPDATE post_meta SET meta_value = ? WHERE post_id = ? AND meta_key = ?', [value, postId, key]);
    } else {
      run('INSERT INTO post_meta (post_id, meta_key, meta_value) VALUES (?, ?, ?)', [postId, key, value]);
    }
  },

  deleteMeta(postId, key) {
    run('DELETE FROM post_meta WHERE post_id = ? AND meta_key = ?', [postId, key]);
  },

  // Counts by status
  countByStatus(postType = 'post') {
    return query('SELECT post_status, COUNT(*) as count FROM posts WHERE post_type = ? GROUP BY post_status', [postType]);
  }
};

module.exports = Post;

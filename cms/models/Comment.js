/**
 * WebsiteMo CMS — Comment Model
 */
const { query, queryOne, run } = require('../database/db');

const Comment = {
  findById(id) {
    const comment = queryOne(`
      SELECT c.*, p.post_title, p.post_type
      FROM comments c
      LEFT JOIN posts p ON c.comment_post_id = p.id
      WHERE c.id = ?
    `, [id]);
    if (!comment) return null;
    comment.meta = this.getMeta(id);
    return comment;
  },

  findAll(options = {}) {
    const {
      status = 'all', // all, 1 (approved), 0 (pending), spam, trash
      postId = null,
      search = '',
      page = 1,
      limit = 20,
      orderBy = 'comment_date',
      order = 'DESC'
    } = options;

    let sql = `
      SELECT c.*, p.post_title, p.post_type, p.post_name as post_slug
      FROM comments c
      LEFT JOIN posts p ON c.comment_post_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status !== 'all') {
      sql += ` AND c.comment_approved = ?`;
      params.push(status);
    }

    if (postId) {
      sql += ` AND c.comment_post_id = ?`;
      params.push(postId);
    }

    if (search) {
      sql += ` AND (c.comment_content LIKE ? OR c.comment_author LIKE ? OR c.comment_author_email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count total
    const countSql = sql.replace('SELECT c.*, p.post_title, p.post_type, p.post_name as post_slug', 'SELECT COUNT(*) as total');
    const countRes = queryOne(countSql, params);
    const total = countRes ? countRes.total : 0;

    // Order & pagination
    const safeOrderBy = ['comment_date', 'id', 'comment_approved', 'comment_author'].includes(orderBy) ? orderBy : 'comment_date';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY c.${safeOrderBy} ${safeOrder}`;

    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const comments = query(sql, params);
    return {
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  create({ postId, author, email, url = '', ip = '', content, parent = 0, userId = 0, status = '1' }) {
    const date = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result = run(`
      INSERT INTO comments (
        comment_post_id, comment_author, comment_author_email, comment_author_url,
        comment_author_ip, comment_date, comment_content, comment_approved, comment_parent, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [postId, author, email, url, ip, date, content, status, parent, userId]);

    // Update post comment count if approved
    if (status === '1') {
      this.updatePostCommentCount(postId);
    }

    return this.findById(result.lastInsertRowid);
  },

  update(id, fields) {
    const allowed = ['comment_author', 'comment_author_email', 'comment_author_url', 'comment_content', 'comment_approved', 'comment_parent'];
    const updates = [];
    const params = [];

    allowed.forEach(key => {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    });

    if (updates.length === 0) return this.findById(id);

    params.push(id);
    run(`UPDATE comments SET ${updates.join(', ')} WHERE id = ?`, params);

    const comment = this.findById(id);
    if (comment) {
      this.updatePostCommentCount(comment.comment_post_id);
    }

    return comment;
  },

  setStatus(id, status) {
    return this.update(id, { comment_approved: status });
  },

  delete(id, forceDelete = false) {
    const comment = this.findById(id);
    if (!comment) return false;

    if (!forceDelete && comment.comment_approved !== 'trash') {
      this.setStatus(id, 'trash');
      return true;
    }

    // Delete comment meta
    run('DELETE FROM comment_meta WHERE comment_id = ?', [id]);
    // Delete comment
    run('DELETE FROM comments WHERE id = ?', [id]);

    this.updatePostCommentCount(comment.comment_post_id);
    return true;
  },

  updatePostCommentCount(postId) {
    const countRes = queryOne("SELECT COUNT(*) as total FROM comments WHERE comment_post_id = ? AND comment_approved = '1'", [postId]);
    const total = countRes ? countRes.total : 0;
    run('UPDATE posts SET comment_count = ? WHERE id = ?', [total, postId]);
  },

  // Meta methods
  getMeta(commentId, key = null) {
    if (key) {
      const row = queryOne('SELECT meta_value FROM comment_meta WHERE comment_id = ? AND meta_key = ?', [commentId, key]);
      return row ? row.meta_value : null;
    }
    const rows = query('SELECT meta_key, meta_value FROM comment_meta WHERE comment_id = ?', [commentId]);
    const meta = {};
    rows.forEach(r => { meta[r.meta_key] = r.meta_value; });
    return meta;
  },

  updateMeta(commentId, key, value) {
    const existing = queryOne('SELECT meta_id FROM comment_meta WHERE comment_id = ? AND meta_key = ?', [commentId, key]);
    if (existing) {
      run('UPDATE comment_meta SET meta_value = ? WHERE meta_id = ?', [value, existing.meta_id]);
    } else {
      run('INSERT INTO comment_meta (comment_id, meta_key, meta_value) VALUES (?, ?, ?)', [commentId, key, value]);
    }
  },

  deleteMeta(commentId, key) {
    run('DELETE FROM comment_meta WHERE comment_id = ? AND meta_key = ?', [commentId, key]);
  },

  getStats() {
    const all = queryOne('SELECT COUNT(*) as count FROM comments WHERE comment_approved != "trash"').count;
    const approved = queryOne('SELECT COUNT(*) as count FROM comments WHERE comment_approved = "1"').count;
    const pending = queryOne('SELECT COUNT(*) as count FROM comments WHERE comment_approved = "0"').count;
    const spam = queryOne('SELECT COUNT(*) as count FROM comments WHERE comment_approved = "spam"').count;
    const trash = queryOne('SELECT COUNT(*) as count FROM comments WHERE comment_approved = "trash"').count;

    return { all, approved, pending, spam, trash };
  }
};

module.exports = Comment;

/**
 * WebsiteMo CMS — Media Attachment Model
 */
const { query, queryOne, run } = require('../database/db');
const Post = require('./Post');
const path = require('path');
const fs = require('fs');

const Media = {
  findById(id) {
    const post = Post.findById(id);
    if (!post || post.post_type !== 'attachment') return null;

    return {
      id: post.id,
      title: post.post_title,
      slug: post.post_name,
      caption: post.post_excerpt,
      description: post.post_content,
      mimeType: post.post_mime_type,
      url: post.guid,
      date: post.post_date,
      author: post.post_author,
      authorName: post.author_name,
      alt: post.meta._wp_attachment_alt || '',
      attachedFile: post.meta._wp_attached_file || '',
      metadata: post.meta._wp_attachment_metadata ? JSON.parse(post.meta._wp_attachment_metadata) : {}
    };
  },

  findAll(options = {}) {
    const {
      mimeType = '',
      search = '',
      month = '',
      page = 1,
      limit = 24
    } = options;

    let sql = `
      SELECT p.*, u.display_name as author_name
      FROM posts p
      LEFT JOIN users u ON p.post_author = u.id
      WHERE p.post_type = 'attachment'
    `;
    const params = [];

    if (mimeType) {
      sql += ` AND p.post_mime_type LIKE ?`;
      params.push(`${mimeType}%`);
    }

    if (search) {
      sql += ` AND (p.post_title LIKE ? OR p.post_content LIKE ? OR p.guid LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (month) {
      // YYYY-MM format
      sql += ` AND strftime('%Y-%m', p.post_date) = ?`;
      params.push(month);
    }

    // Count
    const countSql = sql.replace('SELECT p.*, u.display_name as author_name', 'SELECT COUNT(*) as total');
    const countRes = queryOne(countSql, params);
    const total = countRes ? countRes.total : 0;

    // Order & limit
    sql += ` ORDER BY p.post_date DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const rows = query(sql, params);
    const attachments = rows.map(r => {
      const metaRows = query('SELECT meta_key, meta_value FROM post_meta WHERE post_id = ?', [r.id]);
      const meta = {};
      metaRows.forEach(m => { meta[m.meta_key] = m.meta_value; });

      return {
        id: r.id,
        title: r.post_title,
        slug: r.post_name,
        caption: r.post_excerpt,
        description: r.post_content,
        mimeType: r.post_mime_type,
        url: r.guid,
        date: r.post_date,
        author: r.post_author,
        authorName: r.author_name,
        alt: meta._wp_attachment_alt || '',
        attachedFile: meta._wp_attached_file || '',
        metadata: meta._wp_attachment_metadata ? JSON.parse(meta._wp_attachment_metadata) : {}
      };
    });

    return {
      attachments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  create({ file, title, caption = '', description = '', alt = '', authorId = 1 }) {
    // Relative path for uploads e.g. /uploads/2026/09/filename.png
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const relFile = `uploads/${year}/${month}/${file.filename}`;
    const guid = `/uploads/${year}/${month}/${file.filename}`;

    const attachmentTitle = title || path.parse(file.originalname).name;

    const attachmentPost = Post.create({
      post_author: authorId,
      post_title: attachmentTitle,
      post_content: description,
      post_excerpt: caption,
      post_status: 'inherit',
      post_type: 'attachment',
      post_mime_type: file.mimetype,
      guid: guid
    });

    // Save attachment meta
    Post.updateMeta(attachmentPost.id, '_wp_attached_file', relFile);
    Post.updateMeta(attachmentPost.id, '_wp_attachment_alt', alt);

    const metadata = {
      width: file.width || 0,
      height: file.height || 0,
      filesize: file.size,
      originalName: file.originalname,
      sizes: {}
    };

    Post.updateMeta(attachmentPost.id, '_wp_attachment_metadata', JSON.stringify(metadata));

    return this.findById(attachmentPost.id);
  },

  update(id, { title, caption, description, alt }) {
    const post = Post.findById(id);
    if (!post || post.post_type !== 'attachment') return null;

    Post.update(id, {
      post_title: title !== undefined ? title : post.post_title,
      post_excerpt: caption !== undefined ? caption : post.post_excerpt,
      post_content: description !== undefined ? description : post.post_content
    });

    if (alt !== undefined) {
      Post.updateMeta(id, '_wp_attachment_alt', alt);
    }

    return this.findById(id);
  },

  delete(id) {
    const attachment = this.findById(id);
    if (!attachment) return false;

    // Delete local file from uploads directory
    if (attachment.attachedFile) {
      const fullPath = path.join(__dirname, '../../public', attachment.attachedFile);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.error('Failed to delete file:', e);
        }
      }
    }

    return Post.delete(id, true);
  }
};

module.exports = Media;

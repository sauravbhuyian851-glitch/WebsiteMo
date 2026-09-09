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

    const metaRows = query('SELECT meta_key, meta_value FROM post_meta WHERE post_id = ?', [post.id]);
    const meta = {};
    metaRows.forEach(m => { meta[m.meta_key] = m.meta_value; });

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      caption: post.excerpt,
      description: post.content,
      mimeType: post.mime_type,
      url: post.guid,
      date: post.created_at || post.publish_date,
      author: post.author_id,
      authorName: post.author_name,
      alt: meta._wp_attachment_alt || '',
      attachedFile: meta._wp_attached_file || '',
      metadata: meta._wp_attachment_metadata ? JSON.parse(meta._wp_attachment_metadata) : {}
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
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.post_type = 'attachment'
    `;
    const params = [];

    if (mimeType) {
      sql += ` AND p.mime_type LIKE ?`;
      params.push(`${mimeType}%`);
    }

    if (search) {
      sql += ` AND (p.title LIKE ? OR p.content LIKE ? OR p.guid LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (month) {
      sql += ` AND strftime('%Y-%m', p.created_at) = ?`;
      params.push(month);
    }

    // Count
    const countSql = sql.replace('SELECT p.*, u.display_name as author_name', 'SELECT COUNT(*) as total');
    const countRes = queryOne(countSql, params);
    const total = countRes ? countRes.total : 0;

    // Order & limit
    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const rows = query(sql, params);
    const attachments = rows.map(r => {
      const metaRows = query('SELECT meta_key, meta_value FROM post_meta WHERE post_id = ?', [r.id]);
      const meta = {};
      metaRows.forEach(m => { meta[m.meta_key] = m.meta_value; });

      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        caption: r.excerpt,
        description: r.content,
        mimeType: r.mime_type,
        url: r.guid,
        date: r.created_at || r.publish_date,
        author: r.author_id,
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
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const relFile = `uploads/${year}/${month}/${file.filename}`;
    const guid = `/uploads/${year}/${month}/${file.filename}`;

    const attachmentTitle = title || path.parse(file.originalname).name;

    const attachmentPost = Post.create({
      author_id: authorId,
      title: attachmentTitle,
      content: description,
      excerpt: caption,
      post_status: 'inherit',
      post_type: 'attachment',
      mime_type: file.mimetype,
      guid: guid
    });

    // Save attachment meta
    Post.setMeta(attachmentPost.id, '_wp_attached_file', relFile);
    Post.setMeta(attachmentPost.id, '_wp_attachment_alt', alt);

    const metadata = {
      width: file.width || 0,
      height: file.height || 0,
      filesize: file.size,
      originalName: file.originalname,
      sizes: {}
    };

    Post.setMeta(attachmentPost.id, '_wp_attachment_metadata', JSON.stringify(metadata));

    return this.findById(attachmentPost.id);
  },

  update(id, { title, caption, description, alt }) {
    const post = Post.findById(id);
    if (!post || post.post_type !== 'attachment') return null;

    Post.update(id, {
      title: title !== undefined ? title : post.title,
      excerpt: caption !== undefined ? caption : post.excerpt,
      content: description !== undefined ? description : post.content
    });

    if (alt !== undefined) {
      Post.setMeta(id, '_wp_attachment_alt', alt);
    }

    return this.findById(id);
  },

  delete(id) {
    const attachment = this.findById(id);
    if (!attachment) return false;

    // Delete local file from uploads directory
    if (attachment.attachedFile) {
      const fullPath = path.join(__dirname, '../../uploads', attachment.attachedFile);
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

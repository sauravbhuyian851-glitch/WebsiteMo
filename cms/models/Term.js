/**
 * WebsiteMo CMS — Term & Taxonomy Model
 */
const { query, queryOne, run } = require('../database/db');
const { slugify, uniqueSlug } = require('../utils/slugify');

const Term = {
  // Find term by ID
  findById(id) {
    return queryOne(`
      SELECT t.*, tt.id as term_taxonomy_id, tt.taxonomy, tt.description, tt.parent, tt.count
      FROM terms t
      JOIN term_taxonomy tt ON t.id = tt.term_id
      WHERE t.id = ?
    `, [id]);
  },

  // Get all terms for a taxonomy (e.g. 'category' or 'post_tag')
  findAll(taxonomy = 'category', options = {}) {
    const { search = '', parent = null, orderBy = 'name', order = 'ASC' } = options;
    let sql = `
      SELECT t.id, t.name, t.slug, t.term_group,
             tt.id as term_taxonomy_id, tt.taxonomy, tt.description, tt.parent, tt.count,
             p.name as parent_name
      FROM terms t
      JOIN term_taxonomy tt ON t.id = tt.term_id
      LEFT JOIN terms p ON tt.parent = p.id
      WHERE tt.taxonomy = ?
    `;
    const params = [taxonomy];

    if (search) {
      sql += ` AND (t.name LIKE ? OR t.slug LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (parent !== null) {
      sql += ` AND tt.parent = ?`;
      params.push(parent);
    }

    const safeOrderBy = ['name', 'slug', 'count', 'id'].includes(orderBy) ? orderBy : 'name';
    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY t.${safeOrderBy} ${safeOrder}`;

    return query(sql, params);
  },

  // Create a new term with taxonomy association
  create({ name, slug, taxonomy = 'category', description = '', parent = 0 }) {
    let finalSlug = slug ? slugify(slug) : slugify(name);
    
    // Check if slug exists in this taxonomy
    const existing = queryOne(`
      SELECT t.id FROM terms t
      JOIN term_taxonomy tt ON t.id = tt.term_id
      WHERE t.slug = ? AND tt.taxonomy = ?
    `, [finalSlug, taxonomy]);

    if (existing) {
      finalSlug = uniqueSlug(finalSlug, (checkSlug) => {
        const found = queryOne(`
          SELECT t.id FROM terms t
          JOIN term_taxonomy tt ON t.id = tt.term_id
          WHERE t.slug = ? AND tt.taxonomy = ?
        `, [checkSlug, taxonomy]);
        return !!found;
      });
    }

    // Insert into terms
    const resTerm = run(
      'INSERT INTO terms (name, slug, term_group) VALUES (?, ?, 0)',
      [name, finalSlug]
    );
    const termId = resTerm.lastInsertRowid;

    // Insert into term_taxonomy
    const resTT = run(
      'INSERT INTO term_taxonomy (term_id, taxonomy, description, parent, count) VALUES (?, ?, ?, ?, 0)',
      [termId, taxonomy, description, parent || 0]
    );

    return this.findById(termId);
  },

  // Update term & taxonomy info
  update(id, { name, slug, description, parent }) {
    const term = this.findById(id);
    if (!term) return null;

    if (name || slug) {
      const newName = name !== undefined ? name : term.name;
      let newSlug = slug !== undefined ? slugify(slug) : term.slug;

      if (newSlug !== term.slug) {
        newSlug = uniqueSlug(newSlug, (checkSlug) => {
          const found = queryOne(`
            SELECT t.id FROM terms t
            JOIN term_taxonomy tt ON t.id = tt.term_id
            WHERE t.slug = ? AND tt.taxonomy = ? AND t.id != ?
          `, [checkSlug, term.taxonomy, id]);
          return !!found;
        });
      }

      run('UPDATE terms SET name = ?, slug = ? WHERE id = ?', [newName, newSlug, id]);
    }

    if (description !== undefined || parent !== undefined) {
      const newDesc = description !== undefined ? description : term.description;
      const newParent = parent !== undefined ? parent : term.parent;

      run('UPDATE term_taxonomy SET description = ?, parent = ? WHERE term_id = ?', [
        newDesc,
        newParent,
        id
      ]);
    }

    return this.findById(id);
  },

  // Delete a term and clean up relationships
  delete(id) {
    const term = this.findById(id);
    if (!term) return false;

    // Remove relationships
    run('DELETE FROM term_relationships WHERE term_taxonomy_id = ?', [term.term_taxonomy_id]);
    // Remove term_taxonomy record
    run('DELETE FROM term_taxonomy WHERE term_id = ?', [id]);
    // Remove term record
    run('DELETE FROM terms WHERE id = ?', [id]);

    // Update parent references
    run('UPDATE term_taxonomy SET parent = 0 WHERE parent = ?', [id]);

    return true;
  },

  // Get terms for a specific post (object_id)
  getForPost(postId, taxonomy = null) {
    let sql = `
      SELECT t.id, t.name, t.slug, tt.id as term_taxonomy_id, tt.taxonomy, tt.description
      FROM terms t
      JOIN term_taxonomy tt ON t.id = tt.term_id
      JOIN term_relationships tr ON tt.id = tr.term_taxonomy_id
      WHERE tr.object_id = ?
    `;
    const params = [postId];

    if (taxonomy) {
      sql += ` AND tt.taxonomy = ?`;
      params.push(taxonomy);
    }

    return query(sql, params);
  },

  // Set terms for a post (replaces existing terms of the taxonomy)
  setPostTerms(postId, termIds, taxonomy = 'category') {
    // Get existing term_taxonomy_ids for this taxonomy
    const currentTTs = query(`
      SELECT tr.term_taxonomy_id 
      FROM term_relationships tr
      JOIN term_taxonomy tt ON tr.term_taxonomy_id = tt.id
      WHERE tr.object_id = ? AND tt.taxonomy = ?
    `, [postId, taxonomy]);

    // Remove existing relationships for this taxonomy
    currentTTs.forEach(row => {
      run('DELETE FROM term_relationships WHERE object_id = ? AND term_taxonomy_id = ?', [
        postId,
        row.term_taxonomy_id
      ]);
    });

    // Add new relationships
    termIds.forEach(termId => {
      const tt = queryOne('SELECT id FROM term_taxonomy WHERE term_id = ? AND taxonomy = ?', [
        termId,
        taxonomy
      ]);
      if (tt) {
        run('INSERT OR IGNORE INTO term_relationships (object_id, term_taxonomy_id, term_order) VALUES (?, ?, 0)', [
          postId,
          tt.id
        ]);
      }
    });

    // Recalculate count for affected taxonomies
    this.recountAll();
  },

  // Recalculate item count for terms
  recountAll() {
    const taxonomies = query('SELECT id FROM term_taxonomy');
    taxonomies.forEach(tt => {
      const countRes = queryOne('SELECT COUNT(*) as count FROM term_relationships WHERE term_taxonomy_id = ?', [tt.id]);
      run('UPDATE term_taxonomy SET count = ? WHERE id = ?', [countRes.count, tt.id]);
    });
  }
};

module.exports = Term;

/**
 * WebsiteMo CMS — Categories & Tags Management View
 */
const TaxonomiesView = {
  async render(params = {}, queryParams = {}) {
    const taxonomy = queryParams.taxonomy || 'category';
    const isCat = taxonomy === 'category';
    const title = isCat ? 'Categories' : 'Tags';

    let terms = [];
    try {
      terms = await API.get(`/api/terms?taxonomy=${taxonomy}`);
    } catch (e) {
      console.error(e);
    }

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">${title}</h1>
      </div>

      <div style="display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start;">
        <!-- Add New Term Form (Left Column) -->
        <div class="postbox">
          <div class="postbox-header">
            <h2>Add New ${isCat ? 'Category' : 'Tag'}</h2>
          </div>
          <div class="postbox-inside">
            <form id="addTermForm">
              <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Name</label>
                <input type="text" id="termName" style="width: 100%;" required placeholder="e.g. Technology">
                <span style="font-size: 11px; color: #646970;">The name is how it appears on your site.</span>
              </div>

              <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Slug</label>
                <input type="text" id="termSlug" style="width: 100%;" placeholder="e.g. technology">
                <span style="font-size: 11px; color: #646970;">The "slug" is the URL-friendly version of the name.</span>
              </div>

              ${isCat ? `
                <div style="margin-bottom: 14px;">
                  <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Parent Category</label>
                  <select id="termParent" style="width: 100%;">
                    <option value="0">None</option>
                    ${terms.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                  </select>
                </div>
              ` : ''}

              <div style="margin-bottom: 18px;">
                <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px;">Description</label>
                <textarea id="termDescription" rows="3" style="width: 100%;" placeholder="Brief description..."></textarea>
              </div>

              <button type="submit" class="button button-primary" id="saveTermBtn">Add New ${isCat ? 'Category' : 'Tag'}</button>
            </form>
          </div>
        </div>

        <!-- Terms Table (Right Column) -->
        <div class="table-responsive">
          <table class="wp-list-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Slug</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${terms.length > 0 ? terms.map(t => `
                <tr>
                  <td>
                    <strong><a href="javascript:void(0)" onclick="TaxonomiesView.editTerm(${t.id})" style="color: #1d2327; text-decoration: none;">${t.name}</a></strong>
                    <div class="row-actions">
                      <a href="javascript:void(0)" onclick="TaxonomiesView.editTerm(${t.id})">Edit</a> |
                      <a href="javascript:void(0)" onclick="TaxonomiesView.deleteTerm(${t.id})" class="delete">Delete</a>
                    </div>
                  </td>
                  <td>${t.description || '—'}</td>
                  <td>${t.slug}</td>
                  <td>${t.count}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="4" style="text-align: center; color: #646970; padding: 24px;">No ${title.toLowerCase()} found.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  afterRender(params = {}, queryParams = {}) {
    const taxonomy = queryParams.taxonomy || 'category';
    const form = document.getElementById('addTermForm');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('termName').value;
        const slug = document.getElementById('termSlug').value;
        const description = document.getElementById('termDescription').value;
        const parentSelect = document.getElementById('termParent');
        const parent = parentSelect ? parseInt(parentSelect.value, 10) : 0;

        const btn = document.getElementById('saveTermBtn');
        btn.disabled = true;

        try {
          await API.post('/api/terms', { name, slug, taxonomy, description, parent });
          App.showToast('Item created successfully!', 'success');
          App.reload();
        } catch (err) {
          App.showToast(err.message || 'Failed to create item', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    }
  },

  async deleteTerm(id) {
    if (confirm('Are you sure you want to delete this item?')) {
      await API.delete(`/api/terms/${id}`);
      App.showToast('Item deleted.', 'success');
      App.reload();
    }
  },

  async editTerm(id) {
    const term = await API.get(`/api/terms/${id}`);
    const name = prompt('Edit Name:', term.name);
    if (!name) return;

    const description = prompt('Edit Description:', term.description || '');

    await API.put(`/api/terms/${id}`, { name, description });
    App.showToast('Item updated successfully!', 'success');
    App.reload();
  }
};

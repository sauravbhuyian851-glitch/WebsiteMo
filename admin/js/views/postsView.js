/**
 * WebsiteMo CMS — Posts & Pages List View
 */
const PostsView = {
  async render(params = {}, queryParams = {}) {
    const postType = queryParams.type || 'post';
    const status = queryParams.status || 'all';
    const page = parseInt(queryParams.page || 1, 10);
    const search = queryParams.s || '';

    let postsData, stats;
    try {
      [postsData, stats] = await Promise.all([
        API.get(`/api/posts?post_type=${postType}&status=${status}&page=${page}&search=${encodeURIComponent(search)}`),
        API.get(`/api/posts/stats?post_type=${postType}`)
      ]);
    } catch (e) {
      postsData = { posts: [], pagination: { total: 0, page: 1, totalPages: 1 } };
      stats = { all: 0, publish: 0, draft: 0, trash: 0 };
    }

    const { posts, pagination } = postsData;
    const titlePlural = postType === 'page' ? 'Pages' : 'Posts';
    const newHref = `#/posts/new?type=${postType}`;

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">${titlePlural}</h1>
        <a href="${newHref}" class="page-title-action"><i class="fa-solid fa-plus"></i> Add New ${postType === 'page' ? 'Page' : 'Post'}</a>
      </div>

      <ul class="subsubsub">
        <li><a href="#/posts?type=${postType}&status=all" class="${status === 'all' ? 'current' : ''}">All <span class="count">(${stats.all})</span></a> |</li>
        <li><a href="#/posts?type=${postType}&status=publish" class="${status === 'publish' ? 'current' : ''}">Published <span class="count">(${stats.publish})</span></a> |</li>
        <li><a href="#/posts?type=${postType}&status=draft" class="${status === 'draft' ? 'current' : ''}">Drafts <span class="count">(${stats.draft})</span></a> |</li>
        <li><a href="#/posts?type=${postType}&status=trash" class="${status === 'trash' ? 'current' : ''}">Trash <span class="count">(${stats.trash})</span></a></li>
      </ul>

      <div class="tablenav">
        <div class="actions">
          <select id="bulkActionSelect">
            <option value="-1">Bulk actions</option>
            <option value="trash">Move to Trash</option>
            <option value="restore">Restore</option>
            <option value="delete">Delete Permanently</option>
          </select>
          <button type="button" class="button" id="applyBulkBtn">Apply</button>
        </div>

        <form id="searchPostsForm" style="display: flex; gap: 6px;">
          <input type="search" id="searchInput" placeholder="Search ${titlePlural}..." value="${search}">
          <button type="submit" class="button"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
        </form>
      </div>

      <div class="table-responsive">
        <table class="wp-list-table">
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" id="selectAllCheck"></th>
              <th>Title</th>
              <th>Author</th>
              ${postType === 'post' ? '<th>Categories</th><th>Tags</th>' : ''}
              <th>Comments</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${posts.length > 0 ? posts.map(p => `
              <tr id="post-row-${p.id}">
                <td><input type="checkbox" class="post-checkbox" value="${p.id}"></td>
                <td>
                  <strong><a href="#/posts/edit/${p.id}" style="color: #1d2327; text-decoration: none; font-size: 14px;">${p.post_title || '(no title)'}</a></strong>
                  <div class="row-actions">
                    <a href="#/posts/edit/${p.id}"><i class="fa-solid fa-pen"></i> Edit</a> |
                    <a href="javascript:void(0)" onclick="PostsView.quickEdit(${p.id})"><i class="fa-solid fa-bolt"></i> Quick Edit</a> |
                    ${status === 'trash' ? `
                      <a href="javascript:void(0)" onclick="PostsView.restore(${p.id})"><i class="fa-solid fa-rotate-left"></i> Restore</a> |
                      <a href="javascript:void(0)" onclick="PostsView.deletePermanently(${p.id})" class="delete"><i class="fa-solid fa-trash-can"></i> Delete Permanently</a>
                    ` : `
                      <a href="javascript:void(0)" onclick="PostsView.trash(${p.id})" class="trash"><i class="fa-solid fa-trash-can"></i> Trash</a>
                    `} |
                    <a href="/${p.post_name}" target="_blank"><i class="fa-solid fa-eye"></i> View</a>
                  </div>
                </td>
                <td>${p.author_name || 'Admin'}</td>
                ${postType === 'post' ? `
                  <td>${p.categories && p.categories.length > 0 ? p.categories.map(c => c.name).join(', ') : 'Uncategorized'}</td>
                  <td>${p.tags && p.tags.length > 0 ? p.tags.map(t => t.name).join(', ') : '—'}</td>
                ` : ''}
                <td><i class="fa-solid fa-comment" style="color: #8c8f94;"></i> ${p.comment_count || 0}</td>
                <td><span class="badge-status ${p.post_status}">${p.post_status}</span></td>
                <td><span title="${p.post_date}">${new Date(p.post_date).toLocaleDateString()}</span></td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="${postType === 'post' ? 8 : 6}" style="text-align: center; color: #646970; padding: 24px;">No ${titlePlural.toLowerCase()} found.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="tablenav" style="justify-content: flex-end; margin-top: 16px;">
        <div class="tablenav-pages">
          <span>${pagination.total} items</span>
          ${pagination.totalPages > 1 ? `
            <a href="#/posts?type=${postType}&status=${status}&page=1&s=${search}" class="button button-small ${pagination.page === 1 ? 'disabled' : ''}">«</a>
            <a href="#/posts?type=${postType}&status=${status}&page=${Math.max(1, pagination.page - 1)}&s=${search}" class="button button-small ${pagination.page === 1 ? 'disabled' : ''}">‹</a>
            <span>Page ${pagination.page} of ${pagination.totalPages}</span>
            <a href="#/posts?type=${postType}&status=${status}&page=${Math.min(pagination.totalPages, pagination.page + 1)}&s=${search}" class="button button-small ${pagination.page === pagination.totalPages ? 'disabled' : ''}">›</a>
            <a href="#/posts?type=${postType}&status=${status}&page=${pagination.totalPages}&s=${search}" class="button button-small ${pagination.page === pagination.totalPages ? 'disabled' : ''}">»</a>
          ` : ''}
        </div>
      </div>
    `;
  },

  afterRender() {
    const selectAll = document.getElementById('selectAllCheck');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        document.querySelectorAll('.post-checkbox').forEach(cb => cb.checked = e.target.checked);
      });
    }

    const searchForm = document.getElementById('searchPostsForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const s = document.getElementById('searchInput').value;
        const type = new URLSearchParams(window.location.hash.split('?')[1] || '').get('type') || 'post';
        App.navigate(`#/posts?type=${type}&s=${encodeURIComponent(s)}`);
      });
    }

    const applyBulk = document.getElementById('applyBulkBtn');
    if (applyBulk) {
      applyBulk.addEventListener('click', async () => {
        const action = document.getElementById('bulkActionSelect').value;
        const selectedIds = Array.from(document.querySelectorAll('.post-checkbox:checked')).map(cb => cb.value);

        if (action === '-1' || selectedIds.length === 0) {
          App.showToast('Select an action and at least one item.', 'warning');
          return;
        }

        if (confirm(`Are you sure you want to perform bulk "${action}" on ${selectedIds.length} items?`)) {
          for (const id of selectedIds) {
            if (action === 'trash') await API.delete(`/api/posts/${id}`);
            if (action === 'delete') await API.delete(`/api/posts/${id}?force=true`);
            if (action === 'restore') await API.put(`/api/posts/${id}`, { post_status: 'draft' });
          }
          App.showToast('Bulk action completed.', 'success');
          App.reload();
        }
      });
    }
  },

  async trash(id) {
    if (confirm('Move this item to trash?')) {
      await API.delete(`/api/posts/${id}`);
      App.showToast('Item moved to trash.', 'success');
      App.reload();
    }
  },

  async restore(id) {
    await API.put(`/api/posts/${id}`, { post_status: 'draft' });
    App.showToast('Item restored.', 'success');
    App.reload();
  },

  async deletePermanently(id) {
    if (confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      await API.delete(`/api/posts/${id}?force=true`);
      App.showToast('Item permanently deleted.', 'success');
      App.reload();
    }
  },

  async quickEdit(id) {
    const post = await API.get(`/api/posts/${id}`);
    const row = document.getElementById(`post-row-${id}`);
    if (!row) return;

    row.innerHTML = `
      <td colspan="8" style="background: #fcfcfc; padding: 16px;">
        <h4 style="margin: 0 0 12px 0; font-size: 13px;">Quick Edit</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px;">Title</label>
            <input type="text" id="qe-title-${id}" value="${post.post_title}" style="width: 100%;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px;">Slug</label>
            <input type="text" id="qe-slug-${id}" value="${post.post_name}" style="width: 100%;">
          </div>
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px;">Status</label>
            <select id="qe-status-${id}" style="width: 100%;">
              <option value="publish" ${post.post_status === 'publish' ? 'selected' : ''}>Published</option>
              <option value="draft" ${post.post_status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="pending" ${post.post_status === 'pending' ? 'selected' : ''}>Pending Review</option>
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="button button-primary" onclick="PostsView.saveQuickEdit(${id})">Update</button>
          <button type="button" class="button" onclick="App.reload()">Cancel</button>
        </div>
      </td>
    `;
  },

  async saveQuickEdit(id) {
    const post_title = document.getElementById(`qe-title-${id}`).value;
    const post_name = document.getElementById(`qe-slug-${id}`).value;
    const post_status = document.getElementById(`qe-status-${id}`).value;

    await API.put(`/api/posts/${id}`, { post_title, post_name, post_status });
    App.showToast('Post updated via Quick Edit.', 'success');
    App.reload();
  }
};

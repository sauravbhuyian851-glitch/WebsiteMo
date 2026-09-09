/**
 * WebsiteMo CMS — Block & Content Editor View
 */
const EditorView = {
  async render(params = {}, queryParams = {}) {
    const isEdit = !!params.id;
    const postType = queryParams.type || 'post';

    let post = {
      id: null,
      post_title: '',
      post_content: '',
      post_excerpt: '',
      post_status: 'publish',
      post_name: '',
      post_type: postType,
      categories: [],
      tags: [],
      meta: {}
    };

    let categories = [], tags = [], revisions = [];

    try {
      [categories, tags] = await Promise.all([
        API.get('/api/terms?taxonomy=category'),
        API.get('/api/terms?taxonomy=post_tag')
      ]);

      if (isEdit) {
        post = await API.get(`/api/posts/${params.id}`);
        revisions = await API.get(`/api/posts/${params.id}/revisions`);
      }
    } catch (e) {
      console.error(e);
    }

    const titleText = isEdit ? `Edit ${post.post_type === 'page' ? 'Page' : 'Post'}` : `Add New ${postType === 'page' ? 'Page' : 'Post'}`;
    const selectedCatIds = (post.categories || []).map(c => c.id);

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">${titleText}</h1>
        <div>
          ${isEdit ? `<a href="/${post.post_name}" target="_blank" class="button"><i class="fa-solid fa-eye"></i> View ${post.post_type}</a>` : ''}
        </div>
      </div>

      <form id="editorForm">
        <div class="editor-layout">
          <!-- Main Content Column -->
          <div class="editor-main">
            <input type="text" id="postTitle" class="editor-title-input" placeholder="Add title..." value="${post.post_title || ''}" required>

            ${post.id ? `
              <div style="font-size: 12px; color: #646970; margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
                <strong>Permalink:</strong> http://localhost:3000/<input type="text" id="postSlug" value="${post.post_name || ''}" style="padding: 2px 6px; font-size: 12px; border: 1px solid #c3c4c7; border-radius: 3px;">
              </div>
            ` : ''}

            <!-- Toolbar -->
            <div style="border: 1px solid #c3c4c7; border-bottom: none; background: #f6f7f7; padding: 6px 12px; display: flex; gap: 8px; flex-wrap: wrap; border-top-left-radius: 4px; border-top-right-radius: 4px;">
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<b>', '</b>')"><i class="fa-solid fa-bold"></i></button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<i>', '</i>')"><i class="fa-solid fa-italic"></i></button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<h2>', '</h2>')">H2</button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<h3>', '</h3>')">H3</button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<blockquote>', '</blockquote>')"><i class="fa-solid fa-quote-left"></i></button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<a href=&quot;&quot;>', '</a>')"><i class="fa-solid fa-link"></i></button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<img src=&quot;&quot; alt=&quot;&quot; />', '')"><i class="fa-solid fa-image"></i></button>
              <button type="button" class="button button-small" onclick="EditorView.insertFormat('<code>', '</code>')"><i class="fa-solid fa-code"></i></button>
            </div>

            <!-- Main Editor Textarea / HTML Canvas -->
            <textarea id="postContent" rows="18" style="width: 100%; font-family: monospace; font-size: 14px; line-height: 1.5; border-top-left-radius: 0; border-top-right-radius: 0;" placeholder="Start writing or typing HTML blocks...">${post.post_content || ''}</textarea>

            <!-- Excerpt Section -->
            <div style="margin-top: 24px;">
              <label style="font-weight: 600; display: block; margin-bottom: 6px;">Excerpt</label>
              <textarea id="postExcerpt" rows="3" style="width: 100%;" placeholder="Write a brief excerpt (optional)...">${post.post_excerpt || ''}</textarea>
            </div>
          </div>

          <!-- Sidebar Column -->
          <div class="editor-sidebar">
            <!-- Publish Box -->
            <div class="accordion-section">
              <div class="accordion-header">
                <span><i class="fa-solid fa-paper-plane" style="color: #2271b1;"></i> Publish</span>
              </div>
              <div class="accordion-body">
                <div style="margin-bottom: 12px;">
                  <label style="display: block; font-size: 12px; margin-bottom: 4px; font-weight: 600;">Status</label>
                  <select id="postStatus" style="width: 100%;">
                    <option value="publish" ${post.post_status === 'publish' ? 'selected' : ''}>Published</option>
                    <option value="draft" ${post.post_status === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="pending" ${post.post_status === 'pending' ? 'selected' : ''}>Pending Review</option>
                  </select>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f1;">
                  ${isEdit ? '<a href="javascript:void(0)" id="deletePostBtn" style="color: #d63638; font-size: 12px; text-decoration: none;">Move to Trash</a>' : '<span></span>'}
                  <button type="submit" class="button button-primary button-large" id="savePostBtn">
                    <i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Update' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>

            <!-- Categories Section (Only for posts) -->
            ${postType === 'post' ? `
              <div class="accordion-section">
                <div class="accordion-header">
                  <span><i class="fa-solid fa-folder-tree" style="color: #2271b1;"></i> Categories</span>
                </div>
                <div class="accordion-body">
                  <ul class="category-checklist">
                    ${categories.map(c => `
                      <li>
                        <label>
                          <input type="checkbox" name="categories" value="${c.id}" ${selectedCatIds.includes(c.id) ? 'checked' : ''}>
                          ${c.name}
                        </label>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              </div>

              <!-- Tags Section -->
              <div class="accordion-section">
                <div class="accordion-header">
                  <span><i class="fa-solid fa-tags" style="color: #2271b1;"></i> Tags</span>
                </div>
                <div class="accordion-body">
                  <input type="text" id="postTagsInput" style="width: 100%;" placeholder="Separate tags with commas" value="${(post.tags || []).map(t => t.name).join(', ')}">
                </div>
              </div>
            ` : ''}

            <!-- Revisions Box (If editing) -->
            ${isEdit && revisions.length > 0 ? `
              <div class="accordion-section">
                <div class="accordion-header">
                  <span><i class="fa-solid fa-clock-rotate-left" style="color: #2271b1;"></i> Revisions (${revisions.length})</span>
                </div>
                <div class="accordion-body">
                  <div style="max-height: 140px; overflow-y: auto;">
                    ${revisions.map(r => `
                      <div style="font-size: 12px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                        <span>${new Date(r.post_date).toLocaleTimeString()}</span>
                        <a href="javascript:void(0)" onclick="EditorView.restoreRevision(${post.id}, ${r.id})" style="color: #2271b1;">Restore</a>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </form>
    `;
  },

  afterRender(params = {}, queryParams = {}) {
    const isEdit = !!params.id;

    const form = document.getElementById('editorForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const post_title = document.getElementById('postTitle').value.trim();
        const post_content = document.getElementById('postContent').value;
        const post_excerpt = document.getElementById('postExcerpt').value;
        const post_status = document.getElementById('postStatus').value;
        const slugInput = document.getElementById('postSlug');
        const post_name = slugInput ? slugInput.value : '';

        // Categories
        const categoryCbs = document.querySelectorAll('input[name="categories"]:checked');
        const categories = Array.from(categoryCbs).map(cb => parseInt(cb.value, 10));

        // Tags
        const tagsInput = document.getElementById('postTagsInput');
        const tagNames = tagsInput ? tagsInput.value.split(',').map(s => s.trim()).filter(Boolean) : [];

        const btn = document.getElementById('savePostBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
          const payload = {
            post_title,
            post_content,
            post_excerpt,
            post_status,
            post_name,
            post_type: queryParams.type || 'post',
            categories
          };

          let saved;
          if (isEdit) {
            saved = await API.put(`/api/posts/${params.id}`, payload);
            App.showToast('Post updated successfully!', 'success');
          } else {
            saved = await API.post('/api/posts', payload);
            App.showToast('Post published successfully!', 'success');
            App.navigate(`#/posts/edit/${saved.id}`);
          }
        } catch (err) {
          App.showToast(err.message || 'Failed to save post', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> ${isEdit ? 'Update' : 'Publish'}`;
        }
      });
    }

    const deleteBtn = document.getElementById('deletePostBtn');
    if (deleteBtn && isEdit) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm('Move this post to trash?')) {
          await API.delete(`/api/posts/${params.id}`);
          App.showToast('Post moved to trash.', 'success');
          App.navigate('#/posts');
        }
      });
    }
  },

  insertFormat(startTag, endTag) {
    const textarea = document.getElementById('postContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    const replacement = startTag + selected + endTag;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
  },

  async restoreRevision(postId, revisionId) {
    if (confirm('Restore this revision? Your current draft will be saved as a new revision.')) {
      await API.post(`/api/posts/${postId}/restore/${revisionId}`);
      App.showToast('Revision restored successfully!', 'success');
      App.reload();
    }
  }
};

/**
 * WebsiteMo CMS — Dashboard View
 */
const DashboardView = {
  async render() {
    let data;
    try {
      data = await API.get('/api/stats/dashboard');
    } catch (e) {
      data = {
        atAGlance: { posts: 0, pages: 0, comments: 0, pendingComments: 0 },
        recentPosts: [],
        recentComments: [],
        quickDrafts: [],
        siteHealth: { status: 'Good', passedChecks: 12, recommendedActions: 1 }
      };
    }

    const { atAGlance, recentPosts, recentComments, quickDrafts, siteHealth } = data;

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline"><i class="fa-solid fa-gauge-high"></i> Dashboard</h1>
      </div>

      <div class="postbox" style="background: linear-gradient(135deg, #2271b1 0%, #135e96 100%); color: #fff; padding: 20px; border: none; margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #fff;">Welcome to WebsiteMo CMS!</h2>
        <p style="font-size: 14px; margin: 0 0 16px 0; opacity: 0.9;">We've assembled some links to get you started:</p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <a href="#/posts/new" class="button button-large" style="background: #fff; color: #2271b1; border: none;"><i class="fa-solid fa-pen"></i> Write your first post</a>
          <a href="#/pages/new" class="button button-large" style="background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4);"><i class="fa-solid fa-file-plus"></i> Add an About page</a>
          <a href="/" target="_blank" class="button button-large" style="background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4);"><i class="fa-solid fa-arrow-up-right-from-square"></i> View your site</a>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Site Health Status -->
        <div class="postbox">
          <div class="postbox-header">
            <h2><i class="fa-solid fa-heart-pulse" style="color: #00a32a;"></i> Site Health Status</h2>
          </div>
          <div class="postbox-inside">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #e6f6ec; color: #00a32a; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700;">
                ✓
              </div>
              <div>
                <strong style="font-size: 15px; color: #1d2327;">Your site's health is looking good!</strong>
                <p style="margin: 4px 0 0 0; color: #646970;">${siteHealth.passedChecks} items with no issues detected, ${siteHealth.recommendedActions} recommended action.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- At a Glance -->
        <div class="postbox">
          <div class="postbox-header">
            <h2><i class="fa-solid fa-tachograph-digital" style="color: #2271b1;"></i> At a Glance</h2>
          </div>
          <div class="postbox-inside">
            <ul class="at-a-glance-list">
              <li><i class="fa-solid fa-pin-paper"></i> <a href="#/posts">${atAGlance.posts} Posts</a></li>
              <li><i class="fa-solid fa-file"></i> <a href="#/pages">${atAGlance.pages} Pages</a></li>
              <li><i class="fa-solid fa-comments"></i> <a href="#/comments">${atAGlance.comments} Comments</a></li>
              <li><i class="fa-solid fa-clock"></i> <a href="#/comments?status=0">${atAGlance.pendingComments} Moderation</a></li>
            </ul>
            <hr style="border: none; border-top: 1px solid #f0f0f1; margin: 16px 0;">
            <p style="margin: 0; color: #646970; font-size: 12px;">WebsiteMo CMS v1.0.0 running active theme <strong>WebsiteMo Default Theme</strong>.</p>
          </div>
        </div>

        <!-- Quick Draft -->
        <div class="postbox">
          <div class="postbox-header">
            <h2><i class="fa-solid fa-bolt" style="color: #dba617;"></i> Quick Draft</h2>
          </div>
          <div class="postbox-inside">
            <form id="quickDraftForm">
              <div style="margin-bottom: 12px;">
                <input type="text" id="quickTitle" placeholder="Title" style="width: 100%;" required>
              </div>
              <div style="margin-bottom: 12px;">
                <textarea id="quickContent" rows="3" placeholder="What's on your mind?" style="width: 100%;" required></textarea>
              </div>
              <button type="submit" class="button button-primary" id="saveQuickDraftBtn"><i class="fa-solid fa-floppy-disk"></i> Save Draft</button>
            </form>
            ${quickDrafts && quickDrafts.length > 0 ? `
              <div style="margin-top: 16px;">
                <h4 style="font-size: 12px; text-transform: uppercase; color: #646970; margin: 0 0 8px 0;">Your Recent Drafts</h4>
                ${quickDrafts.map(d => `
                  <div style="margin-bottom: 8px; font-size: 13px;">
                    <a href="#/posts/edit/${d.id}" style="color: #2271b1; font-weight: 600; text-decoration: none;">${d.post_title || 'Untitled'}</a>
                    <span style="color: #8c8f94; font-size: 11px;"> - ${new Date(d.post_date).toLocaleDateString()}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Activity -->
        <div class="postbox">
          <div class="postbox-header">
            <h2><i class="fa-solid fa-chart-line" style="color: #2271b1;"></i> Activity</h2>
          </div>
          <div class="postbox-inside">
            <h4 style="font-size: 12px; text-transform: uppercase; color: #646970; margin: 0 0 10px 0;">Recently Published</h4>
            ${recentPosts.length > 0 ? `
              <ul style="list-style: none; padding: 0; margin: 0 0 16px 0;">
                ${recentPosts.map(p => `
                  <li style="margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; justify-content: space-between;">
                    <a href="#/posts/edit/${p.id}" style="color: #2271b1; text-decoration: none;">${p.post_title}</a>
                    <span style="color: #8c8f94; font-size: 11px;">${new Date(p.post_date).toLocaleDateString()}</span>
                  </li>
                `).join('')}
              </ul>
            ` : '<p style="color: #8c8f94;">No posts published yet.</p>'}

            <h4 style="font-size: 12px; text-transform: uppercase; color: #646970; margin: 16px 0 10px 0;">Recent Comments</h4>
            ${recentComments.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${recentComments.map(c => `
                  <div style="background: #f9f9f9; padding: 8px 10px; border-radius: 4px; border-left: 3px solid #2271b1;">
                    <div style="font-size: 12px; font-weight: 600; color: #1d2327;">${c.comment_author} on <a href="#/posts/edit/${c.comment_post_id}" style="color: #2271b1;">${c.post_title}</a></div>
                    <div style="font-size: 12px; color: #50575e; margin-top: 2px;">"${c.comment_content.substring(0, 70)}..."</div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #8c8f94;">No comments yet.</p>'}
          </div>
        </div>
      </div>
    `;
  },

  afterRender() {
    const quickForm = document.getElementById('quickDraftForm');
    if (quickForm) {
      quickForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('quickTitle').value;
        const content = document.getElementById('quickContent').value;
        const btn = document.getElementById('saveQuickDraftBtn');

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
          await API.post('/api/stats/quick-draft', { title, content });
          App.showToast('Quick draft saved!', 'success');
          App.navigate('#/dashboard');
        } catch (err) {
          App.showToast(err.message || 'Failed to save quick draft', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Draft';
        }
      });
    }
  }
};

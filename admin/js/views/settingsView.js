/**
 * WebsiteMo CMS — Settings / Options View
 */
const SettingsView = {
  async render(params = {}, queryParams = {}) {
    const group = queryParams.group || 'general';

    let options = {};
    try {
      options = await API.get(`/api/options?group=${group}`);
    } catch (e) {
      console.error(e);
    }

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">Settings</h1>
      </div>

      <div class="nav-tab-wrapper">
        <a class="nav-tab ${group === 'general' ? 'nav-tab-active' : ''}" href="#/settings?group=general">General</a>
        <a class="nav-tab ${group === 'writing' ? 'nav-tab-active' : ''}" href="#/settings?group=writing">Writing</a>
        <a class="nav-tab ${group === 'reading' ? 'nav-tab-active' : ''}" href="#/settings?group=reading">Reading</a>
        <a class="nav-tab ${group === 'discussion' ? 'nav-tab-active' : ''}" href="#/settings?group=discussion">Discussion</a>
        <a class="nav-tab ${group === 'media' ? 'nav-tab-active' : ''}" href="#/settings?group=media">Media</a>
        <a class="nav-tab ${group === 'permalink' ? 'nav-tab-active' : ''}" href="#/settings?group=permalink">Permalinks</a>
      </div>

      <form id="settingsForm">
        <div class="postbox" style="max-width: 800px;">
          <div class="postbox-inside">
            ${group === 'general' ? `
              <div style="display: grid; grid-template-columns: 200px 1fr; gap: 16px; margin-bottom: 20px; align-items: center;">
                <label style="font-weight: 600;">Site Title</label>
                <input type="text" id="site_title" value="${options.site_title || 'WebsiteMo'}" style="width: 100%;">

                <label style="font-weight: 600;">Tagline</label>
                <input type="text" id="site_tagline" value="${options.site_tagline || ''}" style="width: 100%;">

                <label style="font-weight: 600;">Administration Email</label>
                <input type="email" id="admin_email" value="${options.admin_email || ''}" style="width: 100%;">

                <label style="font-weight: 600;">Membership</label>
                <label><input type="checkbox" id="users_can_register" ${options.users_can_register === '1' ? 'checked' : ''}> Anyone can register</label>

                <label style="font-weight: 600;">Default User Role</label>
                <select id="default_role" style="width: 200px;">
                  <option value="subscriber" ${options.default_role === 'subscriber' ? 'selected' : ''}>Subscriber</option>
                  <option value="author" ${options.default_role === 'author' ? 'selected' : ''}>Author</option>
                  <option value="editor" ${options.default_role === 'editor' ? 'selected' : ''}>Editor</option>
                </select>
              </div>
            ` : ''}

            ${group === 'reading' ? `
              <div style="display: grid; grid-template-columns: 200px 1fr; gap: 16px; margin-bottom: 20px; align-items: center;">
                <label style="font-weight: 600;">Blog pages show at most</label>
                <input type="number" id="posts_per_page" value="${options.posts_per_page || 10}" style="width: 100px;">

                <label style="font-weight: 600;">Search engine visibility</label>
                <label><input type="checkbox" id="blog_public" ${options.blog_public === '0' ? 'checked' : ''}> Discourage search engines from indexing this site</label>
              </div>
            ` : ''}

            ${group === 'permalink' ? `
              <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; margin-bottom: 12px;">Common Settings</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <label><input type="radio" name="permalink_structure" value="/%postname%/" ${options.permalink_structure === '/%postname%/' ? 'checked' : ''}> <strong>Post name</strong> (http://localhost:3000/sample-post/)</label>
                  <label><input type="radio" name="permalink_structure" value="/%year%/%monthnum%/%postname%/" ${options.permalink_structure === '/%year%/%monthnum%/%postname%/' ? 'checked' : ''}> <strong>Day and name</strong> (http://localhost:3000/2026/09/09/sample-post/)</label>
                  <label><input type="radio" name="permalink_structure" value="/?p=%id%" ${options.permalink_structure === '/?p=%id%' ? 'checked' : ''}> <strong>Plain</strong> (http://localhost:3000/?p=123)</label>
                </div>
              </div>
            ` : ''}

            ${['writing', 'discussion', 'media'].includes(group) ? `
              <p style="color: #646970;">Configuration parameters for ${group} settings.</p>
            ` : ''}

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f1;">
              <button type="submit" class="button button-primary button-large" id="saveSettingsBtn">Save Changes</button>
            </div>
          </div>
        </div>
      </form>
    `;
  },

  afterRender(params = {}, queryParams = {}) {
    const group = queryParams.group || 'general';

    const form = document.getElementById('settingsForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveSettingsBtn');
        btn.disabled = true;

        const payload = {};
        if (group === 'general') {
          payload.site_title = document.getElementById('site_title').value;
          payload.site_tagline = document.getElementById('site_tagline').value;
          payload.admin_email = document.getElementById('admin_email').value;
          payload.users_can_register = document.getElementById('users_can_register').checked ? '1' : '0';
          payload.default_role = document.getElementById('default_role').value;
        } else if (group === 'reading') {
          payload.posts_per_page = document.getElementById('posts_per_page').value;
          payload.blog_public = document.getElementById('blog_public').checked ? '0' : '1';
        } else if (group === 'permalink') {
          const selected = document.querySelector('input[name="permalink_structure"]:checked');
          if (selected) payload.permalink_structure = selected.value;
        }

        try {
          await API.post('/api/options', payload);
          App.showToast('Settings saved successfully!', 'success');
        } catch (err) {
          App.showToast(err.message || 'Failed to save settings', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    }
  }
};

/**
 * WebsiteMo CMS — Plugins & Hook System View
 */
const PluginsView = {
  async render(params = {}, queryParams = {}) {
    let data;
    try {
      data = await API.get('/api/plugins');
    } catch (e) {
      data = { plugins: [], hooksSummary: { actions: {}, filters: {} } };
    }

    const { plugins, hooksSummary } = data;

    return `
      <div class="wp-header-end">
        <h1 class="wp-heading-inline">Plugins</h1>
      </div>

      <div class="nav-tab-wrapper">
        <a class="nav-tab nav-tab-active" href="javascript:void(0)" id="tabPluginsBtn" onclick="PluginsView.switchTab('plugins')">Installed Plugins</a>
        <a class="nav-tab" href="javascript:void(0)" id="tabHooksBtn" onclick="PluginsView.switchTab('hooks')"><i class="fa-solid fa-code-branch"></i> Hook System (Actions & Filters)</a>
      </div>

      <!-- Plugins Tab -->
      <div id="pluginsTab">
        <div class="table-responsive">
          <table class="wp-list-table">
            <thead>
              <tr>
                <th>Plugin</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${plugins.map(p => `
                <tr style="${p.status === 'active' ? 'background: #f0f6fc;' : ''}">
                  <td style="width: 240px;">
                    <strong style="font-size: 14px; color: #1d2327;">${p.name}</strong>
                    <div style="font-size: 11px; color: #646970; margin-top: 2px;">Version ${p.version} | By ${p.author}</div>
                    <div class="row-actions" style="visibility: visible; margin-top: 8px;">
                      ${p.status === 'active' ? `
                        <a href="javascript:void(0)" onclick="PluginsView.togglePlugin('${p.slug}')" style="color: #b32d2e; font-weight: 600;">Deactivate</a>
                      ` : `
                        <a href="javascript:void(0)" onclick="PluginsView.togglePlugin('${p.slug}')" style="color: #2271b1; font-weight: 600;">Activate</a>
                      `}
                    </div>
                  </td>
                  <td>
                    <p style="margin: 0; font-size: 13px; color: #2c3338;">${p.description}</p>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Hooks Tab -->
      <div id="hooksTab" style="display: none;">
        <div class="postbox">
          <div class="postbox-header">
            <h2>Registered Action & Filter Hooks</h2>
          </div>
          <div class="postbox-inside">
            <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #2271b1;">Action Hooks</h3>
            <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
              ${Object.keys(hooksSummary.actions || {}).map(hook => `
                <li style="background: #f6f7f7; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; font-family: monospace; font-size: 13px; display: flex; justify-content: space-between;">
                  <span><strong>${hook}</strong></span>
                  <span style="color: #646970;">${hooksSummary.actions[hook].length} callbacks attached</span>
                </li>
              `).join('')}
            </ul>

            <h3 style="font-size: 14px; margin: 0 0 8px 0; color: #2271b1;">Filter Hooks</h3>
            <ul style="list-style: none; padding: 0;">
              ${Object.keys(hooksSummary.filters || {}).map(hook => `
                <li style="background: #f6f7f7; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; font-family: monospace; font-size: 13px; display: flex; justify-content: space-between;">
                  <span><strong>${hook}</strong></span>
                  <span style="color: #646970;">${hooksSummary.filters[hook].length} callbacks attached</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    if (tab === 'plugins') {
      document.getElementById('pluginsTab').style.display = 'block';
      document.getElementById('hooksTab').style.display = 'none';
      document.getElementById('tabPluginsBtn').classList.add('nav-tab-active');
      document.getElementById('tabHooksBtn').classList.remove('nav-tab-active');
    } else {
      document.getElementById('pluginsTab').style.display = 'none';
      document.getElementById('hooksTab').style.display = 'block';
      document.getElementById('tabPluginsBtn').classList.remove('nav-tab-active');
      document.getElementById('tabHooksBtn').classList.add('nav-tab-active');
    }
  },

  async togglePlugin(slug) {
    const res = await API.post(`/api/plugins/${slug}/toggle`);
    App.showToast(res.message, 'success');
    App.reload();
  }
};

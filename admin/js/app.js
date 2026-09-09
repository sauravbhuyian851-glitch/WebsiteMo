/**
 * WebsiteMo CMS — Main Application Controller
 */
const App = {
  currentUser: null,

  async init() {
    // Check authentication
    const token = localStorage.getItem('cms_token');
    if (!token) {
      window.location.href = '/admin/login.html';
      return;
    }

    try {
      const res = await API.get('/api/auth/me');
      this.currentUser = res.user;
      this.updateUserUI();
    } catch (e) {
      window.location.href = '/admin/login.html';
      return;
    }

    // Event listeners
    window.addEventListener('hashchange', () => this.handleRoute());

    // Sidebar collapse button
    const collapseBtn = document.getElementById('collapse-button');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        document.body.classList.toggle('folded');
      });
    }

    // Mobile menu toggle button
    const mobileBtn = document.getElementById('mobileMenuToggle');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        document.body.classList.toggle('mobile-menu-open');
      });
    }

    // Screen Options toggle button
    const screenOptionsToggle = document.getElementById('screenOptionsToggle');
    const screenMeta = document.getElementById('screen-meta');
    if (screenOptionsToggle && screenMeta) {
      screenOptionsToggle.addEventListener('click', () => {
        screenMeta.classList.toggle('active');
      });
    }

    // Initial routing
    this.handleRoute();
  },

  updateUserUI() {
    if (!this.currentUser) return;
    const displayNameEl = document.getElementById('adminbarUserDisplayName');
    if (displayNameEl) {
      displayNameEl.textContent = `Howdy, ${this.currentUser.display_name}`;
    }
  },

  async handleRoute() {
    const { route, params, queryParams, hash } = Router.parseHash();

    // Update document title
    document.title = `${route.title} ‹ WebsiteMo Admin`;

    // Highlight active sidebar item
    this.updateSidebarActive(hash, route);

    // Render View into content container
    const contentContainer = document.getElementById('wpbody-content');
    if (contentContainer) {
      contentContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: #646970;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

      try {
        const html = await route.view.render(params, queryParams);
        contentContainer.innerHTML = html;
        if (route.view.afterRender) {
          route.view.afterRender(params, queryParams);
        }
      } catch (err) {
        console.error('Render error:', err);
        contentContainer.innerHTML = `<div class="login-error" style="display:block; margin-top: 20px;">Failed to render view: ${err.message}</div>`;
      }
    }
  },

  updateSidebarActive(hash, route) {
    document.querySelectorAll('#adminmenu li').forEach(li => {
      li.classList.remove('current', 'wp-has-current-submenu');
    });

    // Match links
    const links = document.querySelectorAll('#adminmenu a');
    let matchedLink = null;

    links.forEach(a => {
      const href = a.getAttribute('href');
      if (href === hash || (href && hash.startsWith(href.split('?')[0]) && href !== '#/dashboard')) {
        matchedLink = a;
      }
    });

    if (matchedLink) {
      const li = matchedLink.closest('li');
      if (li) li.classList.add('current');
      const parentLi = matchedLink.closest('.wp-has-submenu');
      if (parentLi) parentLi.classList.add('wp-has-current-submenu');
    }
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  reload() {
    this.handleRoute();
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  async logout() {
    if (confirm('Are you sure you want to log out?')) {
      await API.post('/api/auth/logout');
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_user');
      window.location.href = '/admin/login.html';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

/**
 * WebsiteMo CMS — Single Page Application Hash Router
 */
const Router = {
  routes: [
    { path: '/dashboard', view: DashboardView, title: 'Dashboard' },
    { path: '/posts', view: PostsView, title: 'Posts' },
    { path: '/posts/new', view: EditorView, title: 'Add New Post' },
    { path: '/posts/edit/:id', view: EditorView, title: 'Edit Post' },
    { path: '/pages', view: PostsView, title: 'Pages' },
    { path: '/pages/new', view: EditorView, title: 'Add New Page' },
    { path: '/categories', view: TaxonomiesView, title: 'Categories' },
    { path: '/tags', view: TaxonomiesView, title: 'Tags' },
    { path: '/media', view: MediaView, title: 'Media Library' },
    { path: '/comments', view: CommentsView, title: 'Comments' },
    { path: '/users', view: UsersView, title: 'Users' },
    { path: '/plugins', view: PluginsView, title: 'Plugins' },
    { path: '/settings', view: SettingsView, title: 'Settings' }
  ],

  parseHash() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const [pathWithParams, queryString] = hash.split('?');
    
    // Parse query params
    const queryParams = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [key, value] of searchParams.entries()) {
        queryParams[key] = value;
      }
    }

    // Match route
    for (const route of this.routes) {
      const paramNames = [];
      const regexPath = route.path.replace(/:([^/]+)/g, (_, paramName) => {
        paramNames.push(paramName);
        return '([^/]+)';
      });

      const match = pathWithParams.match(new RegExp(`^${regexPath}$`));
      if (match) {
        const params = {};
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { route, params, queryParams, hash };
      }
    }

    // Default fallback to dashboard
    return { route: this.routes[0], params: {}, queryParams, hash: '/dashboard' };
  }
};

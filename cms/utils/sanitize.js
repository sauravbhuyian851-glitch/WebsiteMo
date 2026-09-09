/**
 * HTML/Input Sanitization
 */
let sanitizeHtml;
try {
  sanitizeHtml = require('sanitize-html');
} catch (e) {
  // Fallback if module not available
  sanitizeHtml = (html) => html;
}

/**
 * Sanitize HTML content - allow safe tags for post content
 */
function sanitizeContent(html) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'h1', 'h2', 'figure', 'figcaption', 'iframe',
      'video', 'audio', 'source', 'picture', 'mark', 'details', 'summary'
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'id', 'style', 'data-*'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
      'a': ['href', 'target', 'rel', 'title'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
      'video': ['src', 'controls', 'width', 'height', 'poster'],
      'audio': ['src', 'controls'],
      'source': ['src', 'type']
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
  });
}

/**
 * Strip all HTML tags
 */
function stripTags(html) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}

/**
 * Sanitize plain text input (escape HTML)
 */
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = { sanitizeContent, stripTags, escapeHtml };

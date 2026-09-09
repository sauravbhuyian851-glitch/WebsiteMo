/**
 * URL slug generation
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique slug by appending -N if collision exists
 */
function uniqueSlug(text, existingCheck) {
  let slug = slugify(text);
  if (!slug) slug = 'untitled';
  let candidate = slug;
  let counter = 1;
  while (existingCheck(candidate)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }
  return candidate;
}

module.exports = { slugify, uniqueSlug };

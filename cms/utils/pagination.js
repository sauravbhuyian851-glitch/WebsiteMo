/**
 * Pagination helper
 */
function paginate(query, { page = 1, perPage = 10 }) {
  page = Math.max(1, parseInt(page) || 1);
  perPage = Math.max(1, Math.min(100, parseInt(perPage) || 10));
  const offset = (page - 1) * perPage;
  return { limit: perPage, offset, page, perPage };
}

function paginationMeta(total, page, perPage) {
  const totalPages = Math.ceil(total / perPage);
  return {
    total,
    page,
    perPage,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

module.exports = { paginate, paginationMeta };

export interface objectSearchFilter {
  keySearch?: string;
}

export interface paginationFilter {
  page?: number;
  limit?: number;
}

export interface sortFilter {
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface fullObjectFilter extends objectSearchFilter, paginationFilter, sortFilter {
  isPublished?: string | boolean;
  includeDeleted?: string | boolean;
}
export interface categoryFilter extends objectSearchFilter, sortFilter {}
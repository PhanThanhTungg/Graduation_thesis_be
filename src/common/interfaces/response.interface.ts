export interface successResponse {
  message: string;
  data?: any;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface errorResponse {
  message: string;
  error?: any;
}

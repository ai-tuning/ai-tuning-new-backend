export interface IPagination {
  page?: number;
  limit?: number;
  order?: string;
}

export interface PaginationOptions {
  currentPage: number;
  totalPage: number;
  allDataCount: number;
}

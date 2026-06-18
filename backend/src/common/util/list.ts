import { paginate, PaginatedResult, PaginationDto } from '../dto/pagination.dto';

/**
 * Filter + paginate an in-memory array (used for engine-derived collections
 * that are computed over the whole dataset before being sliced for the client).
 */
export function filterPaginate<T extends Record<string, unknown>>(
  items: T[],
  dto: PaginationDto,
  searchKeys: (keyof T)[] = [],
): PaginatedResult<T> {
  let rows = items;
  const term = dto.search?.trim().toLowerCase();
  if (term && searchKeys.length) {
    rows = rows.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value != null && String(value).toLowerCase().includes(term);
      }),
    );
  }
  const total = rows.length;
  const start = dto.skip;
  const page = rows.slice(start, start + dto.limit);
  return paginate(page, total, dto);
}

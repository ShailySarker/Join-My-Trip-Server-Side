import { Query } from "mongoose";

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IQueryBuilderResult<T> {
  data: T[];
  meta: IPaginationMeta;
}

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  /**
   * Search across specified fields using regex (case-insensitive)
   * Query param: search
   */
  search(searchableFields: string[]): this {
    const searchTerm = this.query?.search as string;

    if (searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      } as any);
    }

    return this;
  }

  /**
   * Filter by exact match or array inclusion
   * All query params except reserved ones (search, sort, limit, page, fields) are used as filters
   * @param filterableFields - Optional array of field names that are allowed to be filtered
   */
  filter(filterableFields?: string[]): this {
    const queryObj = { ...this.query };

    // Remove reserved fields
    const excludeFields = ["search", "sort", "sortBy", "limit", "page", "fields"];
    excludeFields.forEach((field) => delete queryObj[field]);

    // Build filter object
    const filterObj: Record<string, unknown> = {};

    Object.keys(queryObj).forEach((key) => {
      // If filterableFields is provided, only allow those fields
      if (filterableFields && !filterableFields.includes(key)) {
        return; // Skip this field
      }

      const value = queryObj[key];

      // Handle array values (for filtering by array fields like travelInterests)
      if (Array.isArray(value)) {
        filterObj[key] = { $in: value };
      } else if (typeof value === "string" && value.includes(",")) {
        // Handle comma-separated values as array
        filterObj[key] = { $in: value.split(",") };
      } else {
        // Exact match for single values
        filterObj[key] = value;
      }
    });

    if (Object.keys(filterObj).length > 0) {
      this.modelQuery = this.modelQuery.find(filterObj as any);
    }

    return this;
  }

  /**
   * Sort results by specified field and order
   * Query params: 
   *   - sort: field name (e.g., sort=averageRating)
   *   - sortBy: order - 'asc' or 'desc' (default: 'asc')
   * Example: ?sort=averageRating&sortBy=desc
   * @param sortableFields - Optional array of field names that are allowed to be sorted
   */
  sort(sortableFields?: string[]): this {
    let sortField = (this.query?.sort as string) || "createdAt";
    const sortOrder = (this.query?.sortBy as string) || "asc";

    // If sortableFields is provided, validate the sort field
    if (sortableFields && sortableFields.length > 0) {
      // Check if the requested sort field is in the allowed list
      if (!sortableFields.includes(sortField)) {
        // If not allowed, use default sort field
        sortField = "createdAt";
      }
    }

    // Build sort string: field for ascending, -field for descending
    let sortString = sortField;
    
    if (sortOrder.toLowerCase() === "desc") {
      sortString = `-${sortField}`;
    }

    this.modelQuery = this.modelQuery.sort(sortString);

    return this;
  }

  /**
   * Paginate results
   * Query params: page (default: 1), limit (default: 10, max: 100)
   */
  paginate(): this {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const skip = (page - 1) * limit;

    // Enforce max limit
    const finalLimit = Math.min(limit, 100);

    this.modelQuery = this.modelQuery.skip(skip).limit(finalLimit);

    return this;
  }

  /**
   * Select specific fields to return
   * Query param: fields (comma-separated)
   * Example: fields=fullname,email,profilePhoto
   */
  fields(): this {
    const fields =
      (this.query?.fields as string)?.split(",")?.join(" ") || "-__v";

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }

  /**
   * Execute the query and return results with pagination metadata
   */
  async execute(): Promise<IQueryBuilderResult<T>> {
    // Get paginated data
    const data = await this.modelQuery;

    // Calculate pagination metadata
    const page = Number(this.query?.page) || 1;
    const limit = Math.min(Number(this.query?.limit) || 10, 100);

    // Get total count for pagination (need to run a separate count query)
    // Clone the original query conditions without skip/limit
    const countQuery = this.modelQuery.model.find(
      this.modelQuery.getFilter()
    );
    const total = await countQuery.countDocuments();

    const totalPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPage,
      },
    };
  }

  /**
   * Get data without pagination metadata
   */
  async executeWithoutMeta(): Promise<T[]> {
    return await this.modelQuery;
  }
}

export default QueryBuilder;

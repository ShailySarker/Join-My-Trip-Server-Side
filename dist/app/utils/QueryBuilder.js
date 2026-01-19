"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    /**
     * Search across specified fields using regex (case-insensitive)
     * Query param: search
     */
    search(searchableFields) {
        var _a;
        const searchTerm = (_a = this.query) === null || _a === void 0 ? void 0 : _a.search;
        if (searchTerm) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map((field) => ({
                    [field]: { $regex: searchTerm, $options: "i" },
                })),
            });
        }
        return this;
    }
    /**
     * Filter by exact match or array inclusion
     * All query params except reserved ones (search, sort, limit, page, fields) are used as filters
     * @param filterableFields - Optional array of field names that are allowed to be filtered
     */
    filter(filterableFields) {
        const queryObj = Object.assign({}, this.query);
        // Remove reserved fields
        const excludeFields = [
            "search",
            "sortBy",
            "sortOrder",
            "sort",
            "limit",
            "page",
            "fields",
            "amount",
            "totalPeople",
            "averageRating",
            "reviewCount",
            "totalProfileViews",
            "maxGuest",
            "minAge",
            "minBudget",
            "maxBudget",
            "startDate",
            "endDate",
        ];
        excludeFields.forEach((field) => delete queryObj[field]);
        // Build filter object
        const filterObj = {};
        Object.keys(queryObj).forEach((key) => {
            // If filterableFields is provided, only allow those fields
            if (filterableFields && !filterableFields.includes(key)) {
                return; // Skip this field
            }
            const value = queryObj[key];
            // Handle array values (for filtering by array fields like travelInterests)
            if (Array.isArray(value)) {
                filterObj[key] = { $in: value };
            }
            else if (typeof value === "string" && value.includes(",")) {
                // Handle comma-separated values as array
                filterObj[key] = { $in: value.split(",") };
            }
            else {
                // Exact match for single values
                filterObj[key] = value;
            }
        });
        if (Object.keys(filterObj).length > 0) {
            this.modelQuery = this.modelQuery.find(filterObj);
        }
        return this;
    }
    /**
     * Filter by range values (budget range and date range)
     * Query params:
     *   - minBudget: minimum budget (inclusive)
     *   - maxBudget: maximum budget (inclusive)
     *   - startDate: filter for trips starting from this date (inclusive)
     *   - endDate: filter for trips ending by this date (inclusive)
     * Examples:
     *   - ?minBudget=1000&maxBudget=5000
     *   - ?startDate=2024-06-01&endDate=2024-12-31
     */
    filterByRange() {
        var _a, _b, _c, _d;
        const rangeFilter = {};
        // Budget range filtering
        const minBudget = (_a = this.query) === null || _a === void 0 ? void 0 : _a.minBudget;
        const maxBudget = (_b = this.query) === null || _b === void 0 ? void 0 : _b.maxBudget;
        if (minBudget || maxBudget) {
            rangeFilter.budget = {};
            if (minBudget) {
                rangeFilter.budget.$gte = Number(minBudget);
            }
            if (maxBudget) {
                rangeFilter.budget.$lte = Number(maxBudget);
            }
        }
        // Date range filtering
        const startDate = (_c = this.query) === null || _c === void 0 ? void 0 : _c.startDate;
        const endDate = (_d = this.query) === null || _d === void 0 ? void 0 : _d.endDate;
        if (startDate || endDate) {
            // Filter for trips that overlap with the specified date range
            if (startDate && endDate) {
                // Trips that start before or on endDate AND end after or on startDate
                rangeFilter.$and = [
                    { startDate: { $lte: new Date(endDate) } },
                    { endDate: { $gte: new Date(startDate) } },
                ];
            }
            else if (startDate) {
                // Trips that end on or after the startDate
                rangeFilter.endDate = { $gte: new Date(startDate) };
            }
            else if (endDate) {
                // Trips that start on or before the endDate
                rangeFilter.startDate = { $lte: new Date(endDate) };
            }
        }
        if (Object.keys(rangeFilter).length > 0) {
            this.modelQuery = this.modelQuery.find(rangeFilter);
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
    sort(sortableFields) {
        var _a, _b;
        let sortField = ((_a = this.query) === null || _a === void 0 ? void 0 : _a.sortBy) || "createdAt";
        const sortOrder = ((_b = this.query) === null || _b === void 0 ? void 0 : _b.sortOrder) || "asc";
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
    paginate() {
        var _a, _b;
        const page = Number((_a = this.query) === null || _a === void 0 ? void 0 : _a.page) || 1;
        const limit = Number((_b = this.query) === null || _b === void 0 ? void 0 : _b.limit) || 10;
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
    fields() {
        var _a, _b, _c;
        const fields = ((_c = (_b = (_a = this.query) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.split(",")) === null || _c === void 0 ? void 0 : _c.join(" ")) || "-__v";
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    /**
     * Execute the query and return results with pagination metadata
     */
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Get paginated data
            const data = yield this.modelQuery;
            // Calculate pagination metadata
            const page = Number((_a = this.query) === null || _a === void 0 ? void 0 : _a.page) || 1;
            const limit = Math.min(Number((_b = this.query) === null || _b === void 0 ? void 0 : _b.limit) || 10, 100);
            // Get total count for pagination (need to run a separate count query)
            // Clone the original query conditions without skip/limit
            const countQuery = this.modelQuery.model.find(this.modelQuery.getFilter());
            const total = yield countQuery.countDocuments();
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
        });
    }
    /**
     * Get data without pagination metadata
     */
    executeWithoutMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.modelQuery;
        });
    }
}
exports.default = QueryBuilder;

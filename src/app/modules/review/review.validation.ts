import { z } from "zod";

const createReviewSchema = z.object({
  body: z.object({
    reviewedUserId: z
      .string({
        message: "Reviewed user ID is required",
      })
      .min(1, "Reviewed user ID cannot be empty"),
    travelPlanId: z
      .string({
        message: "Travel plan ID is required",
      })
      .min(1, "Travel plan ID cannot be empty"),
    rating: z
      .number({
        message: "Rating is required",
      })
      .min(0, "Rating must be at least 0")
      .max(5, "Rating must be at most 5"),
    comment: z
      .string({
        message: "Comment is required",
      })
      .min(10, "Comment must be at least 10 characters")
      .max(500, "Comment must be at most 500 characters"),
  }),
});

const updateReviewSchema = z.object({
  body: z.object({
    rating: z
      .number()
      .min(0, "Rating must be at least 0")
      .max(5, "Rating must be at most 5")
      .optional(),
    comment: z
      .string()
      .min(10, "Comment must be at least 10 characters")
      .max(500, "Comment must be at most 500 characters")
      .optional(),
  }),
});

export const ReviewValidations = {
  createReviewSchema,
  updateReviewSchema,
};

import { z } from "zod";

const createReviewSchema = z.object({
  revieweeId: z.string({
    message: "Reviewee ID is required",
  }),
  travelId: z.string({
    message: "Travel Plan ID is required",
  }),
  rating: z
    .number({
      message: "Rating is required",
    })
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string({
      message: "Comment is required",
    })
    .min(5, "Comment must be at least 5 characters"),
});

const updateReviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  comment: z
    .string({
      message: "Comment is required",
    })
    .min(5, "Comment must be at least 5 characters")
    .optional(),
});

export const ReviewValidation = {
  createReviewSchema,
  updateReviewSchema,
};

import { ReviewStatus } from './enums';

export interface ReviewResponse {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewSummaryResponse {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

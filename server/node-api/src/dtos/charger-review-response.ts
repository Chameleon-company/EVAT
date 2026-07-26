import { IChargerReview } from "../models/charger-review-model";

export class ChargerReviewResponse {
  public id: string;
  public chargerId: string;
  public userId: string;
  public userName: string;
  public userAvatar?: string;
  public rating: number;
  public comment: string;
  public createdAt: Date;
  public updatedAt: Date;
  public timeAgo: string;

  constructor(review: IChargerReview) {
    this.id = review._id.toString();
    this.chargerId = review.chargerId;
    this.userId = review.userId;
    this.userName = review.userName;
    this.userAvatar = review.userAvatar;
    this.rating = review.rating;
    this.comment = review.comment;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;
    this.timeAgo = this.getTimeAgo(review.createdAt);
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }
}

export class ChargerRatingStatsResponse {
  public averageRating: number;
  public totalReviews: number;
  public ratingDistribution: { [key: number]: number };
  public starRating: string; // Visual representation like "★★★★☆"

  constructor(stats: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }) {
    this.averageRating = stats.averageRating;
    this.totalReviews = stats.totalReviews;
    this.ratingDistribution = stats.ratingDistribution;
    this.starRating = this.generateStarRating(stats.averageRating);
  }

  private generateStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }
}

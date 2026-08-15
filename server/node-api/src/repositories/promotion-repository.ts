import Promotion, { IPromotion, IPromotionDocument } from "../models/promotion-model";
import { FilterQuery, UpdateQuery } from "mongoose";

class PromotionRepository {
  /**
   * Find promotions near a GeoJSON point, including distance in metres.
   */
  async findNearby(
    longitude: number,
    latitude: number,
    maxDistanceMeters: number,
    filter: FilterQuery<IPromotion> = {},
    limit: number = 25
  ): Promise<IPromotion[]> {
    return await Promotion.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distanceMeters",
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: filter,
        },
      },
      { $limit: limit },
    ]);
  }

  /**
   * Find promotions explicitly linked to a charging station.
   */
  async findByStationId(
    stationId: string,
    filter: FilterQuery<IPromotion> = {}
  ): Promise<IPromotionDocument[]> {
    return await Promotion.find({
      stationIds: stationId,
      ...filter,
    }).exec();
  }

  async findById(promotionId: string): Promise<IPromotionDocument | null> {
    return await Promotion.findById(promotionId).exec();
  }

  async findAll(filter: FilterQuery<IPromotion> = {}): Promise<IPromotionDocument[]> {
    return await Promotion.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findWithPagination(
    filter: FilterQuery<IPromotion> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    promotions: IPromotionDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [promotions, total] = await Promise.all([
      Promotion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Promotion.countDocuments(filter).exec(),
    ]);

    return {
      promotions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<IPromotion>): Promise<IPromotionDocument> {
    const promotion = new Promotion(data);
    return await promotion.save();
  }

  async createMany(data: Partial<IPromotion>[]): Promise<IPromotionDocument[]> {
    return await Promotion.insertMany(data) as IPromotionDocument[];
  }

  async update(
    filter: FilterQuery<IPromotion>,
    update: UpdateQuery<IPromotion>
  ): Promise<IPromotionDocument | null> {
    return await Promotion.findOneAndUpdate(filter, update, { new: true }).exec();
  }

  async delete(filter: FilterQuery<IPromotion>): Promise<IPromotionDocument | null> {
    return await Promotion.findOneAndDelete(filter).exec();
  }

  async count(filter: FilterQuery<IPromotion> = {}): Promise<number> {
    return await Promotion.countDocuments(filter).exec();
  }
}

export default new PromotionRepository();

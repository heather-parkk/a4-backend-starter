import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface RatingDoc extends BaseDoc {
  rater: ObjectId;
  ratee: ObjectId;
  rating: boolean; // true is wanting to match, false if not
}

/**
 * concept: Rating [Rating, Qualities]
 */
export default class RatingConcept {
  public readonly ratings: DocCollection<RatingDoc>;
  public readonly matches: DocCollection<RatingDoc>;

  constructor(collectionName: string) {
    this.ratings = new DocCollection<RatingDoc>(collectionName);
    this.matches = new DocCollection<RatingDoc>(collectionName + "_matches");
  }

  // Rater and Ratee rate the user
  async rateUser(rater: ObjectId, ratee: ObjectId, rating: boolean) {
    await this.canRateUser(rater, ratee);
    await this.ratings.createOne({ rater, ratee, rating });

    // Check if mutual positive rating exists
    if (rating) {
      const reciprocalRating = await this.ratings.readOne({ rater: ratee, ratee: rater, rating: true });
      if (reciprocalRating) {
        // if both rating true, then friend
        await this.addFriend(rater, ratee);
      }
    }
    return { msg: "Rating sent." };
  }

  async getRatings(user: ObjectId) {
    return await this.ratings.readMany({
      $or: [{ rater: user }, { ratee: user }],
    });
  }

  private async addFriend(rater: ObjectId, ratee: ObjectId) {
    // Ensure they are not already matched
    await this.assertNotFriends(rater, ratee);
    await this.matches.createOne({ rater, ratee });
  }

  private async assertNotFriends(rater: ObjectId, ratee: ObjectId) {
    const friendship = await this.matches.readOne({
      $or: [
        { rater, ratee },
        { rater: ratee, ratee: rater },
      ],
    });
    if (friendship !== null) {
      throw new AlreadyFriendsError(rater, ratee);
    }
  }

  private async canRateUser(rater: ObjectId, ratee: ObjectId) {
    // Check if they are already rated by this user
    const rating = await this.ratings.readOne({ rater, ratee });
    if (rating) {
      throw new AlreadyRatedError(rater, ratee);
    }
  }
}

export class AlreadyRatedError extends NotAllowedError {
  constructor(
    public readonly rater: ObjectId,
    public readonly ratee: ObjectId,
  ) {
    super("User {0} has already rated user {1}.", rater, ratee);
  }
}

export class AlreadyFriendsError extends NotAllowedError {
  constructor(
    public readonly rater: ObjectId,
    public readonly ratee: ObjectId,
  ) {
    super("Users {0} and {1} are already matched.", rater, ratee);
  }
}

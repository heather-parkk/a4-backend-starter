import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface RatingDoc extends BaseDoc {
  rater: ObjectId;
  ratee: ObjectId;
  rating: boolean; // true is like, false is dislike
}

/**
 * concept: Matching [User]
 */
export default class MatchingConcept {
  public readonly ratings: DocCollection<RatingDoc>;
  public readonly matches: DocCollection<RatingDoc>;

  constructor(collectionName: string) {
    this.ratings = new DocCollection<RatingDoc>(collectionName);
    this.matches = new DocCollection<RatingDoc>(collectionName + "_matches");
  }

  // Rate a user
  async rateUser(rater: ObjectId, ratee: ObjectId, rating: boolean) {
    await this.canRateUser(rater, ratee);
    await this.ratings.createOne({ rater, ratee, rating });

    // Check if mutual positive rating exists
    if (rating) {
      const reciprocalRating = await this.ratings.readOne({ rater: ratee, ratee: rater, rating: true });
      if (reciprocalRating) {
        // If both users liked each other, match them
        await this.addFriend(rater, ratee);
      }
    }
    return { msg: "Rating successfully submitted." };
  }

  // Fetch ratings for a user
  async getRatings(user: ObjectId) {
    return await this.ratings.readMany({
      $or: [{ rater: user }, { ratee: user }],
    });
  }

  // Add friends if not already matched
  private async addFriend(rater: ObjectId, ratee: ObjectId) {
    await this.assertNotFriends(rater, ratee);
    await this.matches.createOne({ rater, ratee });
  }

  // Ensure they are not already friends
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

  // Ensure the user has not already rated the other user
  private async canRateUser(rater: ObjectId, ratee: ObjectId) {
    const rating = await this.ratings.readOne({ rater, ratee });
    if (rating) {
      throw new AlreadyRatedError(rater, ratee);
    }
  }
}

// Custom error classes
export class AlreadyRatedError extends NotAllowedError {
  constructor(
    public readonly rater: ObjectId,
    public readonly ratee: ObjectId,
  ) {
    super(`User ${rater} has already rated user ${ratee}.`);
  }
}

export class AlreadyFriendsError extends NotAllowedError {
  constructor(
    public readonly rater: ObjectId,
    public readonly ratee: ObjectId,
  ) {
    super(`Users ${rater} and ${ratee} are already matched.`);
  }
}

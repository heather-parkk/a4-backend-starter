import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  user: ObjectId;
  gender: string;
  age: number;
  travelStyle: string;
  location: string;
  question_1: string;
  question_2: string;
}

/**
 * concept: UserProfiling
 */
export default class UserProfilingConcept {
  public readonly profiles: DocCollection<ProfileDoc>;

  /**
   * Make an instance of UserProfiling.
   */
  constructor(collectionName: string) {
    this.profiles = new DocCollection<ProfileDoc>(collectionName);

    // Create index on user to make profile search queries performant
    void this.profiles.collection.createIndex({ user: 1 });
  }

  // Create or update a profile
  async updateProfile(userId: ObjectId, profileDetails: Omit<ProfileDoc, "user">) {
    await this.assertValidProfileDetails(profileDetails);

    const existingProfile = await this.profiles.readOne({ user: userId });

    if (existingProfile) {
      await this.profiles.partialUpdateOne({ user: userId }, profileDetails);
      return { msg: "Profile updated successfully!" };
    } else {
      await this.profiles.createOne({ user: userId, ...profileDetails });
      return { msg: "Profile created successfully!" };
    }
  }

  // Get a user's profile
  async getProfile(userId: ObjectId) {
    const profile = await this.profiles.readOne({ user: userId });
    if (!profile) {
      throw new NotFoundError("Profile not found!");
    }
    return profile;
  }

  // Delete a user's profile
  async deleteProfile(userId: ObjectId) {
    const deleted = await this.profiles.deleteOne({ user: userId });
    if (!deleted) {
      throw new NotFoundError("Profile not found to delete!");
    }
    return { msg: "Profile deleted successfully!" };
  }

  // Internal helper function to check valid profile details
  private async assertValidProfileDetails(profileDetails: Omit<ProfileDoc, "user">) {
    const { gender, age, travelStyle, location, question_1, question_2 } = profileDetails;

    if (!gender || !age || !travelStyle || !location || !question_1 || !question_2) {
      throw new BadValuesError("All profile fields must be filled.");
    }

    if (typeof age !== "number" || age < 0) {
      throw new BadValuesError("Age must be a valid number greater than 0.");
    }
  }
}

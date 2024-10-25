import { ObjectId } from "mongodb";
import { z } from "zod";
import { Authing, Chatting, Locating, Matching, SafeMeeting, Sessioning, UserProfiling } from "./app";
import { NotFoundError } from "./concepts/errors";
import { SessionDoc } from "./concepts/sessioning";
import { ProfileDetails, ProfileDoc, ProfileUpdate } from "./concepts/userProfiling";
import DocCollection from "./framework/doc";
import { getExpressRouter, Router } from "./framework/router";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  profiles: DocCollection<ProfileDoc>; // Specify the type for profiles

  constructor() {
    this.profiles = new DocCollection<ProfileDoc>("profiles"); // Initialize profiles collection
  }

  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id); // Store the user ID in the session
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  // Utility function to calculate compatibility between two users
  private calculateCompatibility(userProfile1: ProfileDetails, userProfile2: ProfileDetails): number {
    let compatibilityScore = 0;

    if (userProfile1.location === userProfile2.location) compatibilityScore++;
    if (userProfile1.travelStyle === userProfile2.travelStyle) compatibilityScore++;
    if (userProfile1.question_1 === userProfile2.question_1) compatibilityScore++;
    if (userProfile1.question_2 === userProfile2.question_2) compatibilityScore++;

    return (compatibilityScore / 4) * 100; // Convert score to percentage
  }

  // Matching functionality with compatibility calculation
  @Router.post("/rate")
  async rateUser(session: SessionDoc, targetUserId: ObjectId, like: boolean) {
    const user = Sessioning.getUser(session);
    const currentUserProfile = await UserProfiling.getProfile(new ObjectId(user));
    const targetUserProfile = await UserProfiling.getProfile(targetUserId);

    if (!currentUserProfile || !targetUserProfile) {
      throw new NotFoundError("User profiles not found for rating.");
    }

    // Calculate compatibility based on profile details
    const compatibilityPercentage = this.calculateCompatibility(currentUserProfile, targetUserProfile);

    // Rate the user
    await Matching.rateUser(new ObjectId(user), targetUserId, like);

    // Return compatibility percentage
    return {
      msg: "Rating submitted!",
      compatibility: compatibilityPercentage.toFixed(2),
    };
  }

  @Router.get("/rateable-users")
  async getRateableUsers(session: SessionDoc) {
    const currentUserId = Sessioning.getUser(session); // Get the current user ID

    // Fetch all users except the current one
    const users = await Authing.getUsers();
    const rateableUsers = users.filter((user) => !user._id.equals(currentUserId)); // Exclude current user

    const userProfiles = await Promise.all(
      rateableUsers.map(async (user) => {
        const profile = await UserProfiling.getProfile(user._id);
        return profile
          ? {
              _id: user._id,
              username: user.username,
              age: profile.age,
              gender: profile.gender,
              travelStyle: profile.travelStyle,
              location: profile.location,
              question_1: profile.question_1,
              question_2: profile.question_2,
            }
          : null;
      }),
    );

    return userProfiles.filter((user) => user !== null); // Return only valid profiles
  }

  // Chatting functionality
  @Router.post("/chatting")
  @Router.validate(z.object({ targetUserId: z.string() }))
  async startChat(session: SessionDoc, targetUserId: ObjectId) {
    const user = Sessioning.getUser(session); // Get user directly
    const chat = await Chatting.startSession([new ObjectId(user), targetUserId]); // Ensure ObjectId
    return { msg: "Chat began!", chat };
  }

  @Router.get("/chatting")
  async getChats(session: SessionDoc) {
    const user = Sessioning.getUser(session); // Get user directly
    const chats = await Chatting.getMessages(new ObjectId(user)); // Ensure ObjectId
    return { msg: "Chats retrieved.", chats };
  }

  @Router.delete("/chatting/:id")
  async endChat(chatId: ObjectId) {
    await Chatting.endSession(chatId);
    return { msg: "Chat ended. Find another match soon?" };
  }

  // SafeMeeting functionality
  @Router.get("/meetings")
  async listMeetings(session: SessionDoc) {
    const user = Sessioning.getUser(session); // Get user directly
    const meetings = await SafeMeeting.getMeetings(new ObjectId(user)); // Ensure ObjectId
    return { msg: "Meetings retrieved.", meetings };
  }

  @Router.post("/meetings")
  @Router.validate(
    z.object({
      receiverId: z.string(),
      date: z.string(),
      time: z.string(),
      location: z.string(),
      emergencyContact: z.string().min(10).max(15),
    }),
  )
  async proposeMeeting(session: SessionDoc, receiverId: ObjectId, date: string, time: string, location: string, emergencyContact: string) {
    const user = Sessioning.getUser(session); // Get user directly
    const meeting = await SafeMeeting.proposeMeeting(new ObjectId(user), receiverId, new Date(date), time, location, emergencyContact);
    return { msg: "Meeting proposed!", meeting };
  }

  @Router.delete("/meetings/:id")
  async cancelMeeting(meetingId: ObjectId) {
    await SafeMeeting.denyMeeting(meetingId);
    return { msg: "Meeting canceled." };
  }

  // Locating functionality
  @Router.get("/locating")
  async showLocation(session: SessionDoc) {
    const user = Sessioning.getUser(session); // Get user directly
    const locationDetails = await Locating.viewLocation(new ObjectId(user));
    return { msg: "Location found!", location: locationDetails };
  }

  @Router.post("/locating")
  @Router.validate(z.object({ share: z.boolean() }))
  async updateLocationSharing(session: SessionDoc, share: boolean) {
    const user = Sessioning.getUser(session); // Get user directly
    await Locating.setLocationSharing(new ObjectId(user), share);
    return { msg: `Location sharing ${share ? "enabled" : "disabled"}.` };
  }

  // Fetch specific city details based on location name
  @Router.get("/locating/:locationName")
  async getLocationDetails(session: SessionDoc, locationName: string) {
    try {
      // Fetch location details using the provided locationName
      const locationDetails = await Locating.getLocationDetails(locationName);
      return { msg: "Location details found!", location: locationDetails };
      // eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new NotFoundError(`Location '${locationName}' is not available.`);
    }
  }

  // UserProfiling functionality
  @Router.patch("/profile")
  // @Router.validate(
  //   z.object({
  //     gender: z.enum(["man", "woman", "nonbinary", "other"]),
  //     age: z.number().min(16).max(99),
  //     travelStyle: z.enum(["relaxed", "fast-paced"]),
  //     location: z.enum(["Barcelona", "Thailand", "London"]),
  //     question_1: z.enum(["Agree", "Disagree", "Neutral"]),
  //     question_2: z.enum(["Agree", "Disagree", "Neutral"]),
  //   }),
  // )
  async updateProfile(
    session: SessionDoc,
    gender: "man" | "woman" | "nonbinary" | "other",
    age: number,
    travelStyle: "relaxed" | "fast-paced",
    location: "Barcelona" | "Thailand" | "London",
    question_1: "Agree" | "Disagree" | "Neutral",
    question_2: "Agree" | "Disagree" | "Neutral",
  ) {
    console.log("Session Data:", session); // Log the session data for debugging
    const user = Sessioning.getUser(session); // Get the current user
    const profileDetails: ProfileUpdate = {
      gender,
      age,
      travelStyle,
      location,
      question_1,
      question_2,
    };
    await UserProfiling.updateProfile(new ObjectId(user), profileDetails);
    return { msg: "Profile updated!" };
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);

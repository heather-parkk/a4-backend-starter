import { ObjectId } from "mongodb";

import { getExpressRouter, Router } from "./framework/router";

import { Authing, Chatting, Locating, Matching, SafeMeeting, Sessioning, UserProfiling } from "./app";
import { SessionDoc } from "./concepts/sessioning";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
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
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  // Matching functionality
  @Router.post("/rate")
  @Router.validate(z.object({ targetUserId: z.string(), like: z.boolean() }))
  async rateUser(sessionId: ObjectId, targetUserId: ObjectId, like: boolean) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    await Matching.rateUser(new ObjectId(session.user), targetUserId, like); // Ensure ObjectId
    return { msg: "Rating submitted!" };
  }

  // Chatting functionality
  @Router.post("/chatting")
  @Router.validate(z.object({ targetUserId: z.string() }))
  async startChat(sessionId: ObjectId, targetUserId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    const chat = await Chatting.startSession([new ObjectId(session.user), targetUserId]); // Ensure ObjectId
    return { msg: "Chat began!", chat };
  }

  @Router.get("/chatting")
  async getChats(sessionId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    const chats = await Chatting.getMessages(new ObjectId(session.user)); // Ensure ObjectId
    return { msg: "Chats retrieved.", chats };
  }

  @Router.delete("/chatting/:id")
  async endChat(chatId: ObjectId) {
    await Chatting.endSession(chatId); // Correct method: endSession
    return { msg: "Chat ended. Find another match soon?" };
  }

  // SafeMeeting functionality
  @Router.get("/meetings")
  async listMeetings(sessionId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    const meetings = await SafeMeeting.getMeetings(new ObjectId(session.user)); // Ensure ObjectId
    return { msg: "Meetings retrieved.", meetings };
  }

  @Router.post("/meetings")
  @Router.validate(
    z.object({
      receiverId: z.string(),
      date: z.string(), // String to hold the date value
      time: z.string(), // String to hold the time value
      location: z.string(),
      emergencyContact: z.string().min(10).max(15), // Validation for emergency contact
    }),
  )
  async proposeMeeting(sessionId: ObjectId, receiverId: ObjectId, date: string, time: string, location: string, emergencyContact: string) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    const meeting = await SafeMeeting.proposeMeeting(new ObjectId(session.user), receiverId, new Date(date), time, location, emergencyContact);
    return { msg: "Meeting proposed!", meeting };
  }

  @Router.delete("/meetings/:id")
  async cancelMeeting(meetingId: ObjectId) {
    await SafeMeeting.denyMeeting(meetingId); // Correct method: cancelMeeting
    return { msg: "Meeting canceled." };
  }

  // Locating functionality
  // Locating functionality
  @Router.get("/locating")
  async showLocation(sessionId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    const locationDetails = await Locating.viewLocation(new ObjectId(session.user));
    return { msg: "Location found!", location: locationDetails };
  }

  @Router.post("/locating")
  @Router.validate(z.object({ share: z.boolean() }))
  async updateLocationSharing(sessionId: ObjectId, share: boolean) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    await Locating.setLocationSharing(new ObjectId(session.user), share);
    return { msg: `Location sharing ${share ? "enabled" : "disabled"}.` };
  }

  // UserProfiling functionality
  @Router.patch("/profile")
  @Router.validate(
    z.object({
      gender: z.string(),
      age: z.number(),
      travelStyle: z.string(),
      location: z.string(),
      question_1: z.string(),
      question_2: z.string(),
    }),
  )
  async updateProfile(sessionId: ObjectId, profileDetails: any) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    await UserProfiling.updateProfile(new ObjectId(session.user), profileDetails); // Ensure ObjectId
    return { msg: "Profile updated!" };
  }

  @Router.get("/profile")
  async getProfile(sessionId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    if (!session.user) {
      throw new Error("User not authenticated.");
    }
    const profile = await UserProfiling.getProfile(new ObjectId(session.user)); // Ensure ObjectId
    return { msg: "Profile retrieved.", profile };
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);

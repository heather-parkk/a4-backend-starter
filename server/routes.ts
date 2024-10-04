import { ObjectId } from "mongodb";

import { getExpressRouter, Router } from "./framework/router";

import { Authing, Chatting, Rating, Sessioning } from "./app";
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

  @Router.post("/rate")
  @Router.validate(z.object({ targetUserId: z.string(), like: z.boolean() }))
  async rateUser(sessionId: ObjectId, targetUserId: ObjectId, like: boolean) {
    const session = await Sessioning.getSession(sessionId);
    await Rating.rateUser(session.userId, targetUserId, like);
    return { msg: "Rating submitted!" };
  }

  @Router.post("/chat")
  @Router.validate(z.object({ targetUserId: z.string() }))
  async startChat(sessionId: ObjectId, targetUserId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    const chat = await Chatting.initiateChat(session.userId, targetUserId);
    return { msg: "Chat began!", chat };
  }

  @Router.get("/chats")
  async getChats(userId: ObjectId) {
    const chats = await Chatting.getChatsForUser(userId);
    return { msg: "Chats retrieved.", chats };
  }

  @Router.delete("/chats/:id")
  async endChat(chatId: ObjectId) {
    await Chatting.endChat(chatId);
    return { msg: "Chat ended. Find another match soon?" };
  }

  @Router.get("/meetings")
  async listMeetings(userId: ObjectId) {
    const meetings = await Meeting.getMeetingsForUser(userId);
    return { msg: "Meetings exists.", meetings };
  }

  @Router.delete("/meetings/:id")
  async cancelMeeting(meetingId: ObjectId) {
    await Meeting.cancelMeeting(meetingId);
    return { msg: "Meeting canceled." };
  }

  @Router.get("/locating")
  async showLocation(sessionId: ObjectId) {
    const session = await Sessioning.getSession(sessionId);
    const locationDetails = await Locating.getLocation(session.userId);
    return { msg: "Location found!", location: locationDetails };
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);

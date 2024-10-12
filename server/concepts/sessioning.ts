import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import { NotAllowedError, NotFoundError, UnauthenticatedError } from "./errors";

export type SessionDoc = SessionData;

// Overload express-session's SessionData to store non-string values like user _id
declare module "express-session" {
  export interface SessionData {
    user?: string; // Store user as a stringified ObjectId
  }
}

/**
 * concept: Sessioning [User]
 */
export default class SessioningConcept {
  start(session: SessionDoc, user: ObjectId) {
    this.isLoggedOut(session);
    session.user = user.toString(); // Store user id as a string in the session
  }

  end(session: SessionDoc) {
    this.isLoggedIn(session);
    session.user = undefined; // Clear user from the session
  }

  getUser(session: SessionDoc): ObjectId {
    this.isLoggedIn(session);
    return new ObjectId(session.user); // Convert the stored string back to an ObjectId
  }

  getSession(sessionId: ObjectId): SessionDoc {
    // This method simulates a session retrieval process
    const session = sessionStorage.getSession(sessionId);
    if (!session) {
      throw new NotFoundError(`Session ${sessionId} does not exist!`);
    }
    return session;
  }

  isLoggedIn(session: SessionDoc) {
    if (session.user === undefined) {
      throw new UnauthenticatedError("Must be logged in!");
    }
  }

  isLoggedOut(session: SessionDoc) {
    if (session.user !== undefined) {
      throw new NotAllowedError("Must be logged out!");
    }
  }
}

import AuthenticatingConcept from "./concepts/authenticating";
import ChattingConcept from "./concepts/chatting";
import RatingConcept from "./concepts/rating";
import SessioningConcept from "./concepts/sessioning";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Chatting = new ChattingConcept("chats");
export const Rating = new RatingConcept("ratings");

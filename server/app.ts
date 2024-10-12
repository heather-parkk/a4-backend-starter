import AuthenticatingConcept from "./concepts/authenticating";
import ChattingConcept from "./concepts/chatting";
import LocatingConcept from "./concepts/locating";
import MatchingConcept from "./concepts/matching";
import SafeMeetingConcept from "./concepts/safeMeeting";
import SessioningConcept from "./concepts/sessioning";
import UserProfilingConcept from "./concepts/userProfiling";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Chatting = new ChattingConcept("chats");
export const Matching = new MatchingConcept("ratings");
export const Locating = new LocatingConcept("locations");
export const SafeMeeting = new SafeMeetingConcept("meetings");
export const UserProfiling = new UserProfilingConcept("profiles");

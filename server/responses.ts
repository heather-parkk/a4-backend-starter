// import { Authing } from "./app";
// import { AlreadyFriendsError } from "./concepts/matching"; // Removed missing imports
// import { Router } from "./framework/router";

// /**
//  * This class does useful conversions for the frontend.
//  * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
//  */
// export default class Responses {

//   /**
//    * Convert FriendRequestDoc into more readable format for the frontend
//    * by converting the ids into usernames.
//    */
//   static async friendRequests(requests: FriendRequestDoc[]) {
//     const from = requests.map((request) => request.from);
//     const to = requests.map((request) => request.to);
//     const usernames = await Authing.idsToUsernames(from.concat(to));
//     return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
//   }
// }

// // Registering custom errors
// Router.registerError(PostAuthorNotMatchError, async (e) => {
//   const username = (await Authing.getUserById(e.author)).username;
//   return e.formatWith(username, e._id);
// });

// Router.registerError(AlreadyFriendsError, async (e) => {
//   const [user1, user2] = await Promise.all([Authing.getUserById(e.rater), Authing.getUserById(e.ratee)]);
//   return e.formatWith(user1.username, user2.username);
// });

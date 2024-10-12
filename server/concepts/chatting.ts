import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ChatMessageDoc extends BaseDoc {
  chatId: ObjectId;
  senderId: ObjectId;
  message: string;
  timestamp: Date;
}

export interface ChatSessionDoc extends BaseDoc {
  participants: ObjectId[];
  createdAt: Date;
}

/**
 * concept: Chatting [User]
 */
export default class ChattingConcept {
  public readonly messages: DocCollection<ChatMessageDoc>;
  public readonly sessions: DocCollection<ChatSessionDoc>;

  /**
   * Make an instance of Chatting.
   */
  constructor(collectionName: string) {
    this.messages = new DocCollection<ChatMessageDoc>(`${collectionName}_messages`);
    this.sessions = new DocCollection<ChatSessionDoc>(`${collectionName}_sessions`);
  }

  // Begin a session chatting with the users
  async startSession(participants: ObjectId[]) {
    const createdAt = new Date();
    const _id = await this.sessions.createOne({ participants, createdAt });
    return { msg: "Chat session began! Let's chat!", session: await this.sessions.readOne({ _id }) };
  }

  // Sending messages
  async sendMessage(chatId: ObjectId, senderId: ObjectId, message: string) {
    const timestamp = new Date();
    await this.messages.createOne({ chatId, senderId, message, timestamp });
    return { msg: "Message sent!" };
  }

  // Getting messages
  async getMessages(chatId: ObjectId) {
    return await this.messages.readMany({ chatId }, { sort: { timestamp: 1 } });
  }

  async getSession(chatId: ObjectId) {
    const session = await this.sessions.readOne({ _id: chatId });
    if (!session) {
      throw new NotFoundError(`Chat ${chatId} does not exist!`);
    }
    return session;
  }

  async endSession(chatId: ObjectId) {
    await this.sessions.deleteOne({ _id: chatId });
    return { msg: "Chat session ended." };
  }

  // Checking who is inside the chat
  async assertParticipants(chatId: ObjectId, userId: ObjectId) {
    const session = await this.sessions.readOne({ _id: chatId });
    if (!session) {
      throw new NotFoundError(`Chat session ${chatId} does not exist!`);
    }
    if (!session.participants.includes(userId)) {
      throw new NotAllowedError(`User ${userId} is not in this chat ${chatId}!`);
    }
  }
}

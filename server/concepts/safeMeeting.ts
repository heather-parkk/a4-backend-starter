import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface MeetingDoc extends BaseDoc {
  proposer: ObjectId;
  receiver: ObjectId;
  date: Date;
  time: string;
  location: string;
  emergencyContact: string;
  status: "proposed" | "confirmed" | "denied";
}

/**
 * concept: SafeMeeting
 */
export default class SafeMeetingConcept {
  public readonly meetings: DocCollection<MeetingDoc>;

  /**
   * Make an instance of SafeMeeting.
   */
  constructor(collectionName: string) {
    this.meetings = new DocCollection<MeetingDoc>(collectionName);
  }

  // Propose a new meeting between two users with emergency contact info
  async proposeMeeting(proposerId: ObjectId, receiverId: ObjectId, date: Date, time: string, location: string, emergencyContact: string) {
    await this.assertValidMeetingDetails(date, time, location, emergencyContact);
    const meeting = await this.meetings.createOne({
      proposer: proposerId,
      receiver: receiverId,
      date,
      time,
      location,
      emergencyContact,
      status: "proposed",
    });
    return { msg: "Meeting proposed!", meeting };
  }

  // Confirm a proposed meeting
  async confirmMeeting(meetingId: ObjectId) {
    const meeting = await this.meetings.readOne({ _id: meetingId });
    if (!meeting || meeting.status !== "proposed") {
      throw new NotFoundError("Proposed meeting not found or already confirmed/denied.");
    }
    await this.meetings.partialUpdateOne({ _id: meetingId }, { status: "confirmed" });
    return { msg: "Meeting confirmed!" };
  }

  // Deny a proposed meeting
  async denyMeeting(meetingId: ObjectId) {
    const meeting = await this.meetings.readOne({ _id: meetingId });
    if (!meeting || meeting.status !== "proposed") {
      throw new NotFoundError("Proposed meeting not found or already confirmed/denied.");
    }
    await this.meetings.partialUpdateOne({ _id: meetingId }, { status: "denied" });
    return { msg: "Meeting denied." };
  }

  // Get all meetings for a user
  async getMeetings(userId: ObjectId) {
    return await this.meetings.readMany({
      $or: [{ proposer: userId }, { receiver: userId }],
    });
  }

  // Get meeting details by ID
  async getMeetingById(meetingId: ObjectId) {
    const meeting = await this.meetings.readOne({ _id: meetingId });
    if (!meeting) {
      throw new NotFoundError("Meeting not found.");
    }
    return meeting;
  }

  // Set emergency contact for a specific meeting
  async setEmergencyContact(meetingId: ObjectId, emergencyContact: string) {
    const meeting = await this.meetings.readOne({ _id: meetingId });
    if (!meeting) {
      throw new NotFoundError("Meeting not found.");
    }
    await this.assertValidEmergencyContact(emergencyContact);
    await this.meetings.partialUpdateOne({ _id: meetingId }, { emergencyContact });
    return { msg: "Emergency contact updated." };
  }

  // Internal helper function to validate meeting details
  private async assertValidMeetingDetails(date: Date, time: string, location: string, emergencyContact: string) {
    const currentDate = new Date();

    if (!date || isNaN(date.getTime())) {
      throw new BadValuesError("Invalid date.");
    }
    if (date < currentDate) {
      throw new BadValuesError("The meeting date cannot be in the past.");
    }

    if (!time || !this.isValidTimeFormat(time)) {
      throw new BadValuesError("Invalid time format. Please use HH:MM.");
    }

    if (!location || location.trim().length === 0) {
      throw new BadValuesError("Location must be provided.");
    }

    await this.assertValidEmergencyContact(emergencyContact);
  }

  // Helper function to validate emergency contact details
  private async assertValidEmergencyContact(emergencyContact: string) {
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(emergencyContact)) {
      throw new BadValuesError("Invalid emergency contact number. It must be a valid phone number (10-15 digits).");
    }
  }

  // Helper function to validate time format (HH:MM)
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Matches 00:00 to 23:59
    return timeRegex.test(time);
  }
}

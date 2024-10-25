import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface LocationDoc extends BaseDoc {
  user: ObjectId;
  latitude: number;
  longitude: number;
  locationName: string;
  shared: boolean; // whether the user is sharing their location
}

export interface LocationInfo {
  locationName: string;
  locationDesc: string;
  locationAttr: string[]; // attractions or notable features
  latitude: number;
  longitude: number;
}

/**
 * concept: Locating
 */
export default class LocatingConcept {
  public readonly locations: DocCollection<LocationDoc>;
  public readonly locationDetails: Map<string, LocationInfo>;

  /**
   * Make an instance of Locating.
   */
  constructor(collectionName: string) {
    this.locations = new DocCollection<LocationDoc>(collectionName);

    // Initialize a sample map of location details
    this.locationDetails = new Map<string, LocationInfo>();
    this.initializeLocationDetails();
  }

  // Share or stop sharing location
  async setLocationSharing(userId: ObjectId, share: boolean) {
    const location = await this.locations.readOne({ user: userId });
    if (!location) {
      throw new NotFoundError("Location not found!");
    }
    await this.locations.partialUpdateOne({ user: userId }, { shared: share });
    return { msg: `Location sharing ${share ? "enabled" : "disabled"}!` };
  }

  // Update a user's location
  async updateLocation(userId: ObjectId, latitude: number, longitude: number, locationName: string) {
    await this.assertValidLocation(latitude, longitude, locationName);
    const existingLocation = await this.locations.readOne({ user: userId });

    if (existingLocation) {
      await this.locations.partialUpdateOne({ user: userId }, { latitude, longitude, locationName });
      return { msg: "Location updated successfully!" };
    } else {
      await this.locations.createOne({ user: userId, latitude, longitude, locationName, shared: false });
      return { msg: "Location set successfully!" };
    }
  }

  // View a user's location
  async viewLocation(userId: ObjectId) {
    const location = await this.locations.readOne({ user: userId, shared: true });
    if (!location) {
      throw new NotAllowedError("User is not sharing their location or location not found.");
    }
    return location;
  }

  // Get location details by location name
  async getLocationDetails(locationName: string) {
    const details = this.locationDetails.get(locationName);
    if (!details) {
      throw new NotFoundError(`Details for location ${locationName} not found.`);
    }
    return details;
  }

  // Initialize some sample location details
  private initializeLocationDetails() {
    this.locationDetails.set("New York City", {
      locationName: "New York City",
      locationDesc: "The largest city in the USA, known for Times Square, Central Park, and Broadway.",
      locationAttr: ["Times Square", "Central Park", "Statue of Liberty"],
      latitude: 40.7128,
      longitude: -74.006,
    });
    this.locationDetails.set("Paris", {
      locationName: "Paris",
      locationDesc: "The capital of France, known for the Eiffel Tower, art, and culture.",
      locationAttr: ["Eiffel Tower", "Louvre Museum", "Notre Dame"],
      latitude: 48.8566,
      longitude: 2.3522,
    });
    this.locationDetails.set("Bangkok", {
      locationName: "Bangkok",
      locationDesc: "The bustling capital of Thailand, known for ornate shrines and vibrant street life.",
      locationAttr: ["Grand Palace", "Wat Arun", "Floating Markets"],
      latitude: 13.7563,
      longitude: 100.5018,
    });
    this.locationDetails.set("Barcelona", {
      locationName: "Barcelona",
      locationDesc: "A Spanish city famed for its art, architecture, and the iconic Sagrada Familia.",
      locationAttr: ["Sagrada Familia", "Park Güell", "La Rambla"],
      latitude: 41.3851,
      longitude: 2.1734,
    });
    this.locationDetails.set("Taipei", {
      locationName: "Taipei",
      locationDesc: "The capital of Taiwan, known for its night markets, skyscrapers, and temples.",
      locationAttr: ["Taipei 101", "Shilin Night Market", "National Palace Museum"],
      latitude: 25.033,
      longitude: 121.5654,
    });
    this.locationDetails.set("London", {
      locationName: "London",
      locationDesc: "The capital of the United Kingdom, steeped in history and modern culture.",
      locationAttr: ["Big Ben", "Tower of London", "British Museum"],
      latitude: 51.5074,
      longitude: -0.1278,
    });
    this.locationDetails.set("Shanghai", {
      locationName: "Shanghai",
      locationDesc: "China's largest city, known for its towering skyline and vibrant waterfront.",
      locationAttr: ["The Bund", "Yu Garden", "Oriental Pearl Tower"],
      latitude: 31.2304,
      longitude: 121.4737,
    });
    this.locationDetails.set("Sydney", {
      locationName: "Sydney",
      locationDesc: "Australia's largest city, known for its Sydney Opera House and coastal lifestyle.",
      locationAttr: ["Sydney Opera House", "Sydney Harbour Bridge", "Bondi Beach"],
      latitude: -33.8688,
      longitude: 151.2093,
    });
  }

  // Internal helper function to validate location data
  private async assertValidLocation(latitude: number, longitude: number, locationName: string) {
    if (!locationName || typeof latitude !== "number" || typeof longitude !== "number") {
      throw new BadValuesError("Location name, latitude, and longitude must be valid.");
    }
  }
}

/**
 * Services Index
 * Central export for all API services
 */

export { authService } from "./auth.service";
export { contentService } from "./content.service";
export { chatService } from "./chat.service";
export { eventsService } from "./events.service";
export { followService } from "./follow.service";
export { jobsService } from "./jobs.service";
export { marketplaceService } from "./marketplace.service";
export { servicesService } from "./services.service";
export { notificationsService } from "./notifications.service";
export { searchService } from "./search.service";
export { geoService } from "./geo.service";
export { gamificationService } from "./gamification.service";
export { socialService } from "./social.service";
export { paymentsService } from "./payments.service";
export { adminService } from "./admin.service";
export { departmentService } from "./departments.service";
export { safetyService } from "./safety.service";
export type {
  GuardianRelationship,
  GuardianStatus,
  SosEvent,
  UserStatus,
  Geofence,
  GeofenceType,
  GeofenceAlertEvent,
  CreateGeofencePayload,
  Emergency,
  EmergencyType,
  EmergencySource,
  DispatchStatus,
  ReportEmergencyPayload,
  AgencyName,
} from "./safety.service";
export { tripService } from "./trip.service";
export type { Trip, TripStatus, TripLocation, RoutePoint, StartTripPayload, TripListResult, LocationUpdateResult } from "./trip.service";

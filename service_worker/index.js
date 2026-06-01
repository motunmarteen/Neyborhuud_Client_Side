/**
 * NeyborHuud Custom Service Worker — merged into workbox sw.js by next-pwa.
 * Handles Web Push notifications and notification click/action navigation.
 *
 * next-pwa v5.x bundles this file into public/sw.js via
 * `customWorkerDir: 'service_worker'` in next.config.ts.
 *
 * Notification payload shape expected from backend:
 * {
 *   title: string,
 *   body: string,
 *   data: {
 *     type: string,       // e.g. "sos_triggered", "trip_alert", "message", "safety_alert" …
 *     url: string,        // deep link to open on click
 *     notificationId?: string
 *   }
 * }
 */

/** Map notification type → URL to open on tap */
function resolveUrl(data) {
  if (!data) return "/";
  if (data.url) return data.url;
  switch (data.type) {
    case "sos_triggered":
    case "sos_escalated":
      return data.watchUrl || data.sosEventId
        ? "/safety/incident/" + data.sosEventId
        : "/sos";
    case "sos_resolved":
      return data.watchUrl || "/sos?tab=history";
    case "trip_alert":
    case "trip_started":
    case "trip_overdue":
    case "trip_completed":
      return data.watchUrl || "/safety";
    case "guardian_request":
    case "guardian_accepted":
      return "/safety";
    case "geofence_alert":
      return "/safety";
    case "message":
    case "message_new":
      return data.conversationId
        ? "/chat/" + data.conversationId
        : "/chat";
    case "community_post":
    case "post_reaction":
    case "comment":
      return data.postId ? "/feed/" + data.postId : "/feed";
    case "marketplace":
      return data.listingId
        ? "/marketplace/" + data.listingId
        : "/marketplace";
    default:
      return "/";
  }
}

/** Types that must stay on screen until user acts */
var REQUIRE_INTERACTION_TYPES = [
  "sos_triggered",
  "sos_escalated",
  "trip_alert",
  "trip_overdue",
  "geofence_alert",
  "safety_alert",
];

/** Types that get action buttons */
var SAFETY_TYPES = [
  "sos_triggered",
  "sos_escalated",
  "trip_alert",
  "trip_overdue",
  "geofence_alert",
  "safety_alert",
];

self.addEventListener("push", function (event) {
  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "NeyborHuud", body: event.data.text() };
  }

  var title = data.title || "NeyborHuud";
  var notifData = data.data || {};
  var type = notifData.type || "general";

  var isSafety = SAFETY_TYPES.indexOf(type) !== -1;
  var requireInteraction = REQUIRE_INTERACTION_TYPES.indexOf(type) !== -1;

  var options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: notifData,
    tag: type + (notifData.notificationId ? "_" + notifData.notificationId : ""),
    renotify: true,
    requireInteraction: requireInteraction,
    vibrate: isSafety ? [200, 100, 200, 100, 200] : [100, 50, 100],
    actions: isSafety
      ? [
          { action: "view", title: "View" },
          { action: "dismiss", title: "Dismiss" },
        ]
      : [{ action: "view", title: "Open" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // "dismiss" action — just close the notification, no navigation
  if (event.action === "dismiss") return;

  var d = event.notification.data || {};
  var url = resolveUrl(d);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Focus existing open window
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (
            typeof client.url === "string" &&
            client.url.indexOf(self.registration.scope) === 0 &&
            "focus" in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

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
  "incoming_call",
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
  var isCall = type === "incoming_call";
  var requireInteraction = REQUIRE_INTERACTION_TYPES.indexOf(type) !== -1;

  var options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: notifData,
    // Call notifications use the callId tag so a hangup can replace/clear them.
    tag: isCall
      ? "call-" + (notifData.callId || "")
      : type + (notifData.notificationId ? "_" + notifData.notificationId : ""),
    renotify: true,
    requireInteraction: requireInteraction,
    // Phone-style repeating vibration for incoming calls.
    vibrate: isCall
      ? [400, 200, 400, 200, 400, 200, 400]
      : isSafety
        ? [200, 100, 200, 100, 200]
        : [100, 50, 100],
    actions: isCall
      ? [
          { action: "accept", title: "Accept" },
          { action: "decline", title: "Decline" },
        ]
      : isSafety
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

  // Incoming-call notification: "decline" just notifies open clients and closes;
  // tapping the body or "accept" opens/focuses the app and signals it to answer.
  if (d.type === "incoming_call") {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then(function (clientList) {
          var action = event.action === "decline" ? "decline" : "accept";
          // Tell any open client about the user's choice.
          for (var i = 0; i < clientList.length; i++) {
            clientList[i].postMessage({
              source: "neyborhuud-call",
              action: action,
              callId: d.callId,
            });
          }
          if (action === "decline") return;
          // Accept (or tap): focus an existing window or open one at the chat.
          var url = d.url || "/chat";
          for (var j = 0; j < clientList.length; j++) {
            var c = clientList[j];
            if (
              typeof c.url === "string" &&
              c.url.indexOf(self.registration.scope) === 0 &&
              "focus" in c
            ) {
              c.navigate(url);
              return c.focus();
            }
          }
          if (clients.openWindow) return clients.openWindow(url);
        }),
    );
    return;
  }

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

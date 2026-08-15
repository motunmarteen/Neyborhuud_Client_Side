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
    case "safe_zone":
    case "alert_zone":
    case "restricted_zone":
      return "/safety";
    case "red_zone":
      return "/safety/sentinel";
    case "sos":
    case "sos_alert":
      return data.sosEventId ? "/safety/incident/" + data.sosEventId : "/sos";
    case "trip_escalation":
      return data.tripId ? "/safety/trips/history" : "/safety";
    case "emergency_alert":
      return "/safety/emergency";
    case "kidnapping_tracking_started":
    case "kidnapping_signal_lost":
      return data.sessionId ? "/safety/kidnapping-tracking/watch/" + data.sessionId : "/safety";
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
  "sos",
  "sos_alert",
  "trip_alert",
  "trip_overdue",
  "trip_escalation",
  "geofence_alert",
  "alert_zone",
  "restricted_zone",
  "safety_alert",
  "red_zone",
  "emergency_alert",
  "kidnapping_tracking_started",
  "kidnapping_signal_lost",
];

/** Types that get action buttons */
var SAFETY_TYPES = [
  "sos_triggered",
  "sos_escalated",
  "sos",
  "sos_alert",
  "trip_alert",
  "trip_overdue",
  "trip_escalation",
  "geofence_alert",
  "alert_zone",
  "restricted_zone",
  "safety_alert",
  "red_zone",
  "emergency_alert",
  "kidnapping_tracking_started",
  "kidnapping_signal_lost",
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

/**
 * Background Sync: retries queued offline SOS triggers even if the tab/app
 * that queued them has since been closed. The client (useSosOfflineQueue,
 * via requestBackgroundSync in src/lib/sosOfflineDb.ts) registers a
 * 'sos-retry' sync request whenever a trigger is queued; the browser fires
 * this event once connectivity is restored (possibly much later, and
 * possibly with no page open).
 *
 * IndexedDB (not localStorage, which the SW cannot access) is the shared
 * store — see src/lib/sosOfflineDb.ts for the app-side reader/writer using
 * the exact same DB/store/key names. Duplicated here (not imported) because
 * next-pwa's customWorkerDir bundles this file standalone, outside the
 * Next.js/TypeScript module graph.
 */
var SOS_DB_NAME = "neyborhuud-sos";
var SOS_DB_VERSION = 1;
var SOS_STORE_NAME = "pending-triggers";

function sosOpenDb() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(SOS_DB_NAME, SOS_DB_VERSION);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(SOS_STORE_NAME)) {
        db.createObjectStore(SOS_STORE_NAME, { keyPath: "clientId" });
      }
    };
    req.onsuccess = function () {
      resolve(req.result);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function sosGetAll(db) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(SOS_STORE_NAME, "readonly");
    var req = tx.objectStore(SOS_STORE_NAME).getAll();
    req.onsuccess = function () {
      resolve(req.result || []);
    };
    req.onerror = function () {
      reject(req.error);
    };
  });
}

function sosDelete(db, clientId) {
  return new Promise(function (resolve, reject) {
    var tx = db.transaction(SOS_STORE_NAME, "readwrite");
    tx.objectStore(SOS_STORE_NAME).delete(clientId);
    tx.oncomplete = function () {
      resolve();
    };
    tx.onerror = function () {
      reject(tx.error);
    };
  });
}

/** Notify any open tabs so their in-memory queue status updates immediately. */
function sosNotifyClients(message) {
  return self.clients.matchAll({ type: "window" }).then(function (clientList) {
    clientList.forEach(function (client) {
      client.postMessage(message);
    });
  });
}

function sosReplayQueue() {
  var db;
  return sosOpenDb()
    .then(function (openedDb) {
      db = openedDb;
      return sosGetAll(db);
    })
    .then(function (records) {
      if (!records.length) return;
      return records
        .reduce(function (chain, record) {
          return chain.then(function () {
            if (!record.authToken) {
              // Nothing we can authenticate the request with — leave queued
              // for the app to retry once it's foregrounded and the token
              // is available again, rather than sending an unauthenticated
              // request that's guaranteed to 401.
              return;
            }
            return fetch(record.apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + record.authToken,
              },
              body: JSON.stringify(record.payload),
            })
              .then(function (res) {
                // 2xx (sent) or 4xx (server permanently rejected it, e.g.
                // validation) — either way, stop retrying this one.
                if (res.ok || (res.status >= 400 && res.status < 500)) {
                  return sosDelete(db, record.clientId);
                }
                // 5xx / unexpected — leave it queued, next sync retries.
              })
              .catch(function () {
                // Still offline or request failed outright — leave queued.
                // Returning a resolved promise (not rethrowing) lets the
                // rest of the queue still get a chance this pass.
              });
          });
        }, Promise.resolve())
        .then(function () {
          return sosNotifyClients({ type: "sos-sync-complete" });
        });
    })
    .finally(function () {
      if (db) db.close();
    });
}

self.addEventListener("sync", function (event) {
  if (event.tag === "sos-retry") {
    event.waitUntil(sosReplayQueue());
  }
});

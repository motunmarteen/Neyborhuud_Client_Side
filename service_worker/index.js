/**
 * NeyborHuud Custom Service Worker — merged into workbox sw.js by next-pwa.
 * Handles Web Push notifications and notification click navigation.
 *
 * next-pwa v5.x will bundle this file into the generated public/sw.js
 * when `customWorkerSrc: 'service_worker'` is set in next.config.ts.
 */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "NeyborHuud", body: event.data.text() };
  }

  var title = data.title || "NeyborHuud";
  var options = {
    body: data.body || "",
    icon: "/icon.png",
    badge: "/icon.png",
    data: data.data || {},
    tag: data.data && data.data.type ? data.data.type : "neyborhuud",
    renotify: true,
    requireInteraction: !!(
      data.data &&
      (data.data.type === "sos_triggered" || data.data.type === "trip_alert")
    ),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var url = "/";
  var d = event.notification.data || {};

  if (d.watchUrl) {
    url = d.watchUrl;
  } else if (
    d.type === "sos_triggered" ||
    d.type === "trip_alert" ||
    d.type === "trip_started"
  ) {
    url = d.watchUrl || "/safety";
  } else if (d.type === "guardian_request") {
    url = "/safety";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

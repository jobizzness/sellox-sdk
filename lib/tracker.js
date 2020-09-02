export var TRACKER_EVENTS;
(function (TRACKER_EVENTS) {
    TRACKER_EVENTS["PLACED_ORDER"] = "PLACED_ORDER";
    TRACKER_EVENTS["NAVIGATED"] = "NAVIGATED";
})(TRACKER_EVENTS || (TRACKER_EVENTS = {}));
class TrackerModoule {
    tag(event, payload = {}) {
        switch (event) {
            case TRACKER_EVENTS.PLACED_ORDER:
                gtag("event", "placed_order", payload);
                // dataLayer.push({ page_path: payload.path });
                break;
            default:
                break;
        }
    }
}
export const Tracker = new TrackerModoule();
//# sourceMappingURL=tracker.js.map
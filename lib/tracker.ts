declare var gtag;

export enum TRACKER_EVENTS {
  PLACED_ORDER = "PLACED_ORDER",
  NAVIGATED = "NAVIGATED",
}

class TrackerModoule {
  tag(event, payload = {} as any) {
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

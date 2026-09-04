import { describe, expect, it } from "vitest";
import { blockedBecause } from "../../src/engine/actions";
import { findAction } from "../../src/data/actions";
import { PHONE_APPS } from "../../src/data/items";
import { talkableAt } from "../../src/engine/talk";
import { WAKE_BEATS } from "../../src/data/schedule";
import { at, awake } from "../testUtils";

describe("the phone", () => {
  it("has an app for everything the wake-up scene says is waiting", () => {
    const promised = WAKE_BEATS.flatMap((beat) => (beat.kind === "notification" ? beat.apps : []));
    const labels = PHONE_APPS.map((app) => app.label);

    for (const app of promised) {
      expect(labels, `起床演出が見せた「${app}」がスマホにない`).toContain(app);
    }
  });

  it("reaches both secretaries through the phone app, wherever the player is", () => {
    const byPhone = (place: Parameters<typeof at>[1]) =>
      talkableAt(at(awake(), place))
        .filter((tree) => tree.channel === "phone")
        .map((tree) => tree.id);

    expect(byPhone("bath")).toEqual(["sawatari", "shinozuka"]);
    expect(byPhone("office")).toEqual(["sawatari", "shinozuka"]);
  });

  it("can always say why a news app will not open, instead of doing nothing", () => {
    // 設計書16章。押しても黙って何も起きないボタンは作らない。
    const news = findAction("news")!;
    const evening = findAction("news-evening")!;

    // 06:00の寝室では朝刊が読める。夜のニュースは、居間に降りてもまだ無い。
    expect(blockedBecause(awake(), news)).toBeNull();
    expect(blockedBecause(at(awake(), "living"), evening)).toBe("time");
    expect(blockedBecause(awake(), evening)).toBe("place");

    // 官邸の執務室には、どちらも無い。
    const kantei = { ...at(awake(), "office"), clock: 300 };
    expect(blockedBecause(kantei, news)).toBe("place");
    expect(blockedBecause(kantei, evening)).toBe("place");

    // 21:00のリビングでは、朝刊はもう古く、夜のニュースが開く。
    const night = { ...at(awake(), "living"), clock: 900 };
    expect(blockedBecause(night, news)).toBe("time");
    expect(blockedBecause(night, evening)).toBeNull();
  });

  it("points every app at something — an action that exists, or a screen of its own", () => {
    for (const app of PHONE_APPS) {
      for (const actionId of app.actionIds ?? []) {
        expect(findAction(actionId), `${app.label} が指す ${actionId} が無い`).toBeDefined();
      }
    }
  });
});

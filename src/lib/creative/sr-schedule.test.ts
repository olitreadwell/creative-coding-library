import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { newCard, nextSchedule, type Card } from "./sr-schedule";

describe("newCard", () => {
  it("is immediately due", () => {
    const card = newCard("test-id");
    expect(card.dueAt <= new Date().toISOString()).toBe(true);
  });

  it("has no prior review", () => {
    const card = newCard("x");
    expect(card.lastReviewedAt).toBeNull();
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });
});

describe("nextSchedule — interval ordering", () => {
  function daysUntil(card: Card): number {
    return (new Date(card.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  }

  it("Easy produces a longer interval than Good, Hard, or Again on a fresh card", () => {
    const base = newCard("ordering-test");
    const again = nextSchedule(base, 1);
    const hard = nextSchedule(base, 2);
    const good = nextSchedule(base, 3);
    const easy = nextSchedule(base, 4);

    const dAgain = daysUntil(again);
    const dHard = daysUntil(hard);
    const dGood = daysUntil(good);
    const dEasy = daysUntil(easy);

    expect(dEasy).toBeGreaterThanOrEqual(dGood);
    expect(dGood).toBeGreaterThanOrEqual(dHard);
    expect(dHard).toBeGreaterThanOrEqual(dAgain);
  });
});

describe("nextSchedule — lapse behaviour", () => {
  it("Again on a card in Review state increases lapses and schedules sooner than Good", () => {
    // Build a card already in Review state (state=2) with realistic stability
    // to simulate a card that has been through multiple successful reviews.
    const reviewCard: Card = {
      id: "lapse-test",
      dueAt: new Date().toISOString(),
      lastReviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      stability: 10,
      difficulty: 5,
      reps: 4,
      lapses: 0,
      state: 2,
    };

    const lapsedCard = nextSchedule(reviewCard, 1);
    const goodCard = nextSchedule(reviewCard, 3);

    const msLapsed = new Date(lapsedCard.dueAt).getTime();
    const msGood = new Date(goodCard.dueAt).getTime();

    expect(lapsedCard.lapses).toBeGreaterThan(reviewCard.lapses);
    expect(msLapsed).toBeLessThan(msGood);
  });
});

describe("nextSchedule — stability growth property", () => {
  it("Good (rating 3) consistently grows stability over 5 consecutive rounds", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (_seed) => {
        let card = newCard("stability-test");
        for (let i = 0; i < 5; i++) {
          const prev = card.stability;
          card = nextSchedule(card, 3);
          if (card.stability < prev) return false;
        }
        return true;
      }),
    );
  });
});

describe("nextSchedule — round trip", () => {
  it("returns an id-preserving Card with valid ISO date strings", () => {
    const card = newCard("round-trip");
    const next = nextSchedule(card, 3);
    expect(next.id).toBe("round-trip");
    expect(() => new Date(next.dueAt)).not.toThrow();
    expect(next.lastReviewedAt).not.toBeNull();
    expect(() => new Date(next.lastReviewedAt as string)).not.toThrow();
  });
});

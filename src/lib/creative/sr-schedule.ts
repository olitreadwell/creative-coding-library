import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating as FsrsRating,
  State as FsrsState,
  type Card as FsrsCard,
  type Grade,
} from "ts-fsrs";

export type Rating = 1 | 2 | 3 | 4;

export type Card = {
  id: string;
  dueAt: string;
  lastReviewedAt: string | null;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3;
};

const RATING_MAP: Record<Rating, Grade> = {
  1: FsrsRating.Again as Grade,
  2: FsrsRating.Hard as Grade,
  3: FsrsRating.Good as Grade,
  4: FsrsRating.Easy as Grade,
};

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 36500,
    enable_fuzz: false,
  }),
);

function toFsrsCard(card: Card): FsrsCard {
  return {
    ...createEmptyCard(),
    due: new Date(card.dueAt),
    last_review: card.lastReviewedAt !== null ? new Date(card.lastReviewedAt) : undefined,
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as FsrsState,
  };
}

export function newCard(id: string): Card {
  return {
    id,
    dueAt: new Date().toISOString(),
    lastReviewedAt: null,
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: 0,
  };
}

export function nextSchedule(card: Card, rating: Rating): Card {
  const now = new Date();
  const fsrsCard = toFsrsCard(card);
  const result = scheduler.next(fsrsCard, now, RATING_MAP[rating]);
  const next = result.card;
  return {
    id: card.id,
    dueAt: next.due.toISOString(),
    lastReviewedAt: now.toISOString(),
    stability: next.stability,
    difficulty: next.difficulty,
    reps: next.reps,
    lapses: next.lapses,
    state: next.state as 0 | 1 | 2 | 3,
  };
}

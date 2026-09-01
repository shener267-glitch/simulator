/**
 * The morning phase runs 05:00 to 08:00. Every time in the game is stored as
 * an offset in minutes from 05:00, so arithmetic never has to cross an hour
 * boundary by hand.
 */
export type Minutes = number;

export const MORNING_START_HOUR = 5;
export const MORNING_LENGTH: Minutes = 180;

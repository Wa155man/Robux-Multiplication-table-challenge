
export type GameState = 'selecting_difficulty' | 'playing' | 'won';

export enum Difficulty {
  Easy = 'Easy',
  Moderate = 'Moderate',
  Hard = 'Hard',
}

export enum Language {
  English = 'English',
  Hebrew = 'Hebrew',
  Russian = 'Russian',
}

export interface Question {
  num1: number;
  num2: number;
  answer: number;
  options: number[];
}
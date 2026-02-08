export type studioConfig = {
  maxResults: number;
  minQueryLength: number;
  snippetRadiusChars: number;
};

export const studioConfig: studioConfig = {
  maxResults: 5,
  minQueryLength: 3,
  snippetRadiusChars: 180,
};

export type IncomingTweet = {
  id: string;
  text: string;
  authorHandle: string;
  authorId: string;
  inReplyToStatusId?: string | null;
  mentions: string[];
  isRetweet?: boolean;
  isQuote?: boolean;
};
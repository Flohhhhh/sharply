import "server-only";

import { checkBotId } from "botid/server";

export type BotIdClassification = {
  isBot: boolean;
};

export async function classifyBotTraffic(): Promise<BotIdClassification> {
  try {
    const { isBot } = await checkBotId();

    return { isBot };
  } catch {
    return { isBot: false };
  }
}

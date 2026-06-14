import "server-only";

import { checkBotId } from "botid/server";

export type BotIdClassification = {
  isBot: boolean;
};

const checkBotIdSafe = checkBotId as () => Promise<BotIdClassification>;

export async function classifyBotTraffic(): Promise<BotIdClassification> {
  try {
    const { isBot } = await checkBotIdSafe();

    return { isBot };
  } catch {
    return { isBot: false };
  }
}

import "server-only";

import { checkBotId } from "botid/server";

export type BotIdClassification = {
  isBot: boolean;
};

export async function classifyBotTraffic(): Promise<BotIdClassification> {
  try {
    const result = await checkBotId();
    if (
      !result ||
      typeof result !== "object" ||
      typeof result.isBot !== "boolean"
    ) {
      throw new TypeError("Unexpected BotID response shape");
    }

    const { isBot } = result;

    return { isBot };
  } catch {
    return { isBot: false };
  }
}

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const messagesDirectory = path.join(process.cwd(), "messages");

type GearDetailMessages = {
  gearDetail?: {
    review?: string;
    reviews?: string;
    alternatives?: string;
  };
};

function readGearDetailMessages(localeFileName: string) {
  const localePath = path.join(messagesDirectory, localeFileName);
  const localeMessages = JSON.parse(
    fs.readFileSync(localePath, "utf8"),
  ) as GearDetailMessages;

  return localeMessages.gearDetail ?? {};
}

describe("gear detail heading translations", () => {
  it("keeps review and alternatives labels localized for every shipped locale", () => {
    expect(readGearDetailMessages("en.json")).toMatchObject({
      review: "Review",
      reviews: "Reviews",
      alternatives: "Alternatives",
    });

    expect(readGearDetailMessages("de.json")).toMatchObject({
      review: "Rezension",
      reviews: "Rezensionen",
      alternatives: "Alternativen",
    });

    expect(readGearDetailMessages("es.json")).toMatchObject({
      review: "Reseña",
      reviews: "Reseñas",
      alternatives: "Alternativas",
    });

    expect(readGearDetailMessages("fr.json")).toMatchObject({
      review: "Test",
      reviews: "Tests",
      alternatives: "Alternatives",
    });

    expect(readGearDetailMessages("it.json")).toMatchObject({
      review: "Recensione",
      reviews: "Recensioni",
      alternatives: "Alternative",
    });

    expect(readGearDetailMessages("ja.json")).toMatchObject({
      review: "レビュー",
      reviews: "レビュー",
      alternatives: "代替候補",
    });

    expect(readGearDetailMessages("ms.json")).toMatchObject({
      review: "Semakan",
      reviews: "Ulasan",
      alternatives: "Alternatif",
    });
  });
});

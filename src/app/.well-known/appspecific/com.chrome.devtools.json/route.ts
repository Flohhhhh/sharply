export const dynamic = "force-static";

export async function GET() {
  return Response.json(
    {},
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

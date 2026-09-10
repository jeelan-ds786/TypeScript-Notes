import { getSiteMetadata } from "@/lib/site-metadata";

export const dynamic = "force-static";

export function GET() {
  return Response.json(getSiteMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=31536000, immutable",
    },
  });
}
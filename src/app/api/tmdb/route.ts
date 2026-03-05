import { NextRequest, NextResponse } from "next/server";
import { 
  getPopularMovies, 
  getPopularTVShows, 
  searchMovies, 
  searchTVShows 
} from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type"); // "movie" or "tv"
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    if (type === "movie") {
      if (query) {
        const data = await searchMovies(query, page);
        return NextResponse.json(data);
      } else {
        const data = await getPopularMovies(page);
        return NextResponse.json(data);
      }
    } else if (type === "tv") {
      if (query) {
        const data = await searchTVShows(query, page);
        return NextResponse.json(data);
      } else {
        const data = await getPopularTVShows(page);
        return NextResponse.json(data);
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("TMDB API proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch from TMDB" }, { status: 500 });
  }
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

const getTMDBToken = () => {
  const token = process.env.TMDB_TOKEN;
  if (!token) {
    throw new Error("TMDB_TOKEN environment variable is not set");
  }
  return token;
};

export async function fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const token = getTMDBToken();
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getPopularMovies(page = 1) {
  return fetchTMDB<TMDBResponse<TMDBMovie>>("/movie/popular", {
    page: page.toString(),
  });
}

export async function searchMovies(query: string, page = 1) {
  return fetchTMDB<TMDBResponse<TMDBMovie>>("/search/movie", {
    query,
    page: page.toString(),
  });
}

export async function getPopularTVShows(page = 1) {
  return fetchTMDB<TMDBResponse<TMDBTVShow>>("/tv/popular", {
    page: page.toString(),
  });
}

export async function searchTVShows(query: string, page = 1) {
  return fetchTMDB<TMDBResponse<TMDBTVShow>>("/search/tv", {
    query,
    page: page.toString(),
  });
}

export function getTMDBImageUrl(path: string | null, size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500") {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

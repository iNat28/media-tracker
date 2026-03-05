import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

interface ExternalRatingInput {
  source: string;
  value: string;
}

interface MediaItemInput {
  id: number;
  title: string;
  type: string;
  poster_path?: string | null;
  year?: string | number | null;
  ratings?: ExternalRatingInput[];
}

interface WatchlistPostRequest {
  mediaItem: MediaItemInput;
  status?: string;
  rating?: number | null;
  notes?: string | null;
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const watchLogs = await prisma.watchLog.findMany({
      where: { userId: session.user.id },
      include: {
        mediaItem: {
          include: {
            ratings: true
          }
        }
      },
      orderBy: { watchedAt: "desc" }
    });

    return NextResponse.json(watchLogs);
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as WatchlistPostRequest;
    const { mediaItem, status, rating, notes } = body;

    const parsedYear = typeof mediaItem.year === 'number' 
      ? mediaItem.year 
      : (mediaItem.year ? parseInt(String(mediaItem.year), 10) : null);

    // 1. Ensure MediaItem exists in our DB
    const dbMedia = await prisma.mediaItem.upsert({
      where: { id: mediaItem.id },
      update: {
        title: mediaItem.title,
        type: mediaItem.type.toLowerCase() === "movie" ? "MOVIE" : "TV",
        posterPath: mediaItem.poster_path,
        year: parsedYear,
      },
      create: {
        id: mediaItem.id,
        title: mediaItem.title,
        type: mediaItem.type.toLowerCase() === "movie" ? "MOVIE" : "TV",
        posterPath: mediaItem.poster_path,
        year: parsedYear,
      }
    });

    // 2. Sync External Ratings if provided
    if (mediaItem.ratings && Array.isArray(mediaItem.ratings)) {
      for (const r of mediaItem.ratings) {
        await prisma.rating.upsert({
          where: {
            mediaId_source: {
              mediaId: dbMedia.id,
              source: r.source
            }
          },
          update: { value: r.value },
          create: {
            mediaId: dbMedia.id,
            source: r.source,
            value: r.value
          }
        });
      }
    }

    // 3. Create or Update WatchLog
    const watchLog = await prisma.watchLog.upsert({
      where: {
        userId_mediaId: {
          userId: session.user.id,
          mediaId: dbMedia.id
        }
      },
      update: {
        status: status ? status.toUpperCase().replace(/-/g, '_') : "PLAN_TO_WATCH",
        rating: rating !== undefined ? rating : undefined,
        notes: notes || undefined,
      },
      create: {
        userId: session.user.id,
        mediaId: dbMedia.id,
        status: status ? status.toUpperCase().replace(/-/g, '_') : "PLAN_TO_WATCH",
        rating: rating !== undefined ? rating : null,
        notes: notes || null,
      }
    });

    return NextResponse.json(watchLog);
  } catch (error) {
    console.error("Failed to sync watchlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mediaId } = (await request.json()) as { mediaId: number };

    await prisma.watchLog.delete({
      where: {
        userId_mediaId: {
          userId: session.user.id,
          mediaId: mediaId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete from watchlist:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

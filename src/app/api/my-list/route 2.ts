import { NextResponse } from "next/server";
import { WatchStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

type ClientWatchStatus = "plan-to-watch" | "watching" | "watched";

type ListPayload = {
  catalogId?: unknown;
  status?: unknown;
};

const statusToDb: Record<ClientWatchStatus, WatchStatus> = {
  "plan-to-watch": WatchStatus.PLAN_TO_WATCH,
  watching: WatchStatus.WATCHING,
  watched: WatchStatus.WATCHED,
};

const statusFromDb: Record<WatchStatus, ClientWatchStatus> = {
  PLAN_TO_WATCH: "plan-to-watch",
  WATCHING: "watching",
  WATCHED: "watched",
};

function parseCatalogId(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function parseStatus(value: unknown): ClientWatchStatus | null {
  if (value === "plan-to-watch" || value === "watching" || value === "watched") {
    return value;
  }

  return null;
}

async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.userListItem.findMany({
    where: { userId },
    select: { catalogId: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      catalogId: item.catalogId,
      status: statusFromDb[item.status],
    })),
  });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ListPayload;
  const catalogId = parseCatalogId(body.catalogId);
  const status = body.status === undefined ? "plan-to-watch" : parseStatus(body.status);

  if (!catalogId || !status) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item = await prisma.userListItem.upsert({
    where: {
      userId_catalogId: {
        userId,
        catalogId,
      },
    },
    update: { status: statusToDb[status] },
    create: {
      userId,
      catalogId,
      status: statusToDb[status],
    },
    select: {
      catalogId: true,
      status: true,
    },
  });

  return NextResponse.json(
    {
      item: {
        catalogId: item.catalogId,
        status: statusFromDb[item.status],
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ListPayload;
  const catalogId = parseCatalogId(body.catalogId);
  const status = parseStatus(body.status);

  if (!catalogId || !status) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item = await prisma.userListItem.update({
    where: {
      userId_catalogId: {
        userId,
        catalogId,
      },
    },
    data: { status: statusToDb[status] },
    select: {
      catalogId: true,
      status: true,
    },
  }).catch(() => null);

  if (!item) {
    return NextResponse.json({ error: "List item not found" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      catalogId: item.catalogId,
      status: statusFromDb[item.status],
    },
  });
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ListPayload;
  const catalogId = parseCatalogId(body.catalogId);

  if (!catalogId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await prisma.userListItem.delete({
    where: {
      userId_catalogId: {
        userId,
        catalogId,
      },
    },
  }).catch(() => null);

  return new Response(null, { status: 204 });
}

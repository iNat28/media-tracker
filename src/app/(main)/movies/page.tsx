"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CatalogItem, sampleCatalog } from "@/lib/mock-catalog";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

type WatchStatus = "plan-to-watch" | "watching" | "watched";

type ListItem = CatalogItem & {
  status: WatchStatus;
};

type ApiListItem = {
  catalogId: number;
  status: WatchStatus;
};

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: "plan-to-watch", label: "Plan to watch" },
  { value: "watching", label: "Watching" },
  { value: "watched", label: "Watched" },
];

export default function MoviesPage() {
  const { data: session } = authClient.useSession();
  const [query, setQuery] = useState("");
  const [myList, setMyList] = useState<ListItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isMutating, setIsMutating] = useState<number[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  const catalogById = useMemo(
    () => new Map(sampleCatalog.map((item) => [item.id, item])),
    [],
  );

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sampleCatalog;
    }

    return sampleCatalog.filter((item) =>
      `${item.title} ${item.type} ${item.genre}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const fetchList = useCallback(async () => {
    if (!session) return;

    setIsListLoading(true);
    setListError(null);

    try {
      const response = await fetch("/api/my-list", { method: "GET" });
      if (!response.ok) {
        throw new Error("Failed to load your list");
      }

      const payload = (await response.json()) as { items?: ApiListItem[] };
      const mappedItems =
        payload.items
          ?.map((entry) => {
            const catalogItem = catalogById.get(entry.catalogId);
            if (!catalogItem) return null;

            return { ...catalogItem, status: entry.status };
          })
          .filter((entry): entry is ListItem => entry !== null) ?? [];

      setMyList(mappedItems);
    } catch {
      setListError("Could not load your list right now.");
    } finally {
      setIsListLoading(false);
    }
  }, [catalogById, session]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const addPending = (itemId: number) => {
    setIsMutating((current) => (current.includes(itemId) ? current : [...current, itemId]));
  };

  const removePending = (itemId: number) => {
    setIsMutating((current) => current.filter((id) => id !== itemId));
  };

  const addToList = async (item: CatalogItem) => {
    if (isMutating.includes(item.id)) return;

    setListError(null);
    addPending(item.id);

    setMyList((currentList) => {
      if (currentList.some((currentItem) => currentItem.id === item.id)) {
        return currentList;
      }

      return [...currentList, { ...item, status: "plan-to-watch" }];
    });

    try {
      const response = await fetch("/api/my-list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catalogId: item.id, status: "plan-to-watch" }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }
    } catch {
      setMyList((currentList) => currentList.filter((currentItem) => currentItem.id !== item.id));
      setListError("Could not add item to your list.");
    } finally {
      removePending(item.id);
    }
  };

  const updateStatus = async (itemId: number, status: WatchStatus) => {
    if (isMutating.includes(itemId)) return;

    const previousStatus = myList.find((item) => item.id === itemId)?.status;
    if (!previousStatus || previousStatus === status) return;

    setListError(null);
    addPending(itemId);
    setMyList((currentList) =>
      currentList.map((item) => (item.id === itemId ? { ...item, status } : item)),
    );

    try {
      const response = await fetch("/api/my-list", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catalogId: itemId, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }
    } catch {
      setMyList((currentList) =>
        currentList.map((item) => (item.id === itemId ? { ...item, status: previousStatus } : item)),
      );
      setListError("Could not update item status.");
    } finally {
      removePending(itemId);
    }
  };

  const removeFromList = async (itemId: number) => {
    if (isMutating.includes(itemId)) return;

    const previousItem = myList.find((item) => item.id === itemId);
    if (!previousItem) return;

    setListError(null);
    addPending(itemId);
    setMyList((currentList) => currentList.filter((item) => item.id !== itemId));

    try {
      const response = await fetch("/api/my-list", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ catalogId: itemId }),
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Failed to remove item");
      }
    } catch {
      setMyList((currentList) => [...currentList, previousItem]);
      setListError("Could not remove item from your list.");
    } finally {
      removePending(itemId);
    }
  };

  if (!session) return null;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[2fr_1fr] px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Movies & TV</h1>
        <p className="mt-2 text-slate-600">
          Search titles and add what you are currently consuming.
        </p>

        <div className="mt-6">
          <Input
            label="Search sample catalog"
            id="media-search"
            type="text"
            sizeVariant="lg"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: drama, Dune, TV show..."
          />
        </div>

        <div className="mt-6 max-h-[34rem] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/40 p-3">
          <ul className="grid gap-3">
            {filteredCatalog.map((item) => {
              const isInMyList = myList.some((listItem) => listItem.id === item.id);
              const isPending = isMutating.includes(item.id);

              return (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                    <p className="text-sm text-slate-600">
                      {item.type} • {item.year} • {item.genre}
                    </p>
                  </div>
                  <Button
                    size="md"
                    onClick={() => addToList(item)}
                    disabled={isInMyList || isPending}
                    className="w-auto px-6"
                  >
                    {isPending ? "Saving..." : isInMyList ? "Added" : "Add to My List"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        {filteredCatalog.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            No matches found for your search.
          </p>
        ) : null}

        {listError ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {listError}
          </p>
        ) : null}
      </section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm self-start">
        <h2 className="text-xl font-semibold text-slate-900">My List</h2>
        <p className="mt-1 text-sm text-slate-600">
          {myList.length} {myList.length === 1 ? "title" : "titles"} added
        </p>

        {isListLoading ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Loading your list...
          </p>
        ) : myList.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Your list is empty. Add a movie or TV show from the catalog.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {myList.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-600">
                      {item.type} • {item.year}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFromList(item.id)}
                    disabled={isMutating.includes(item.id)}
                    className="px-2 py-1 text-[10px] w-auto h-auto leading-none min-h-0"
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-2">
                  <Select
                    label="Status"
                    sizeVariant="sm"
                    value={item.status}
                    onChange={(event) => updateStatus(item.id, event.target.value as WatchStatus)}
                    options={STATUS_OPTIONS}
                    disabled={isMutating.includes(item.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

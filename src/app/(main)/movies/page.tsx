"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { MediaSearch, MediaItem } from "@/components/MediaSearch";

type WatchStatus = "plan-to-watch" | "watching" | "watched";

type ListItem = MediaItem & {
  status: WatchStatus;
};

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: "plan-to-watch", label: "Plan to watch" },
  { value: "watching", label: "Watching" },
  { value: "watched", label: "Watched" },
];

export default function MoviesPage() {
  const { data: session } = authClient.useSession();
  const [myList, setMyList] = useState<ListItem[]>([]);

  const addToList = (item: MediaItem) => {
    setMyList((currentList) => {
      if (currentList.some((currentItem) => currentItem.id === item.id)) {
        return currentList;
      }

      return [...currentList, { ...item, status: "plan-to-watch" }];
    });
  };

  const updateStatus = (itemId: number, status: WatchStatus) => {
    setMyList((currentList) =>
      currentList.map((item) => (item.id === itemId ? { ...item, status } : item)),
    );
  };

  const removeFromList = (itemId: number) => {
    setMyList((currentList) => currentList.filter((item) => item.id !== itemId));
  };

  const isInMyList = (id: number) => myList.some((item) => item.id === id);

  if (!session) return null;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[2fr_1fr] px-6">
      <MediaSearch 
        type="movie" 
        onAddToMyList={addToList} 
        isInMyList={isInMyList} 
      />

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm self-start">
        <h2 className="text-xl font-semibold text-slate-900">My List</h2>
        <p className="mt-1 text-sm text-slate-600">
          {myList.length} {myList.length === 1 ? "title" : "titles"} added
        </p>

        {myList.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Your list is empty. Add a movie from the catalog.
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

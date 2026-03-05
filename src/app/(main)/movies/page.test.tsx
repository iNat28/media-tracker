import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MoviesPage from "./page";
import { authClient } from "@/lib/auth-client";
import { MediaItem } from "@/components/MediaSearch";

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

interface MediaSearchProps {
  onAddToMyList: (item: MediaItem) => void;
}

// Mock MediaSearch to avoid actual fetching
vi.mock("@/components/MediaSearch", () => ({
  MediaSearch: ({ onAddToMyList }: MediaSearchProps) => (
    <div>
      <button onClick={() => onAddToMyList({ id: 1, title: "Neon Movie", year: 2024, type: "Movie" })}>
        Add Neon Movie
      </button>
    </div>
  ),
}));

describe("MoviesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for guest users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    const { container } = render(<MoviesPage />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the movies page and adds/removes movies", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "Jane Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<MoviesPage />);
    
    // Add a movie via the mocked MediaSearch
    const addButton = screen.getByRole("button", { name: /Add Neon Movie/i });
    fireEvent.click(addButton);

    // Check if it appears in "My List"
    expect(screen.getByText("Neon Movie")).toBeDefined();
    
    // Remove it
    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    // Check if list is empty again
    expect(screen.getByText(/your list is empty/i)).toBeDefined();
  });
});

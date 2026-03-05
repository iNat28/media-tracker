import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MoviesPage from "./page";
import { authClient } from "@/lib/auth-client";

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

// Mock the catalog with a small set for fast testing
vi.mock("@/lib/mock-catalog", () => ({
  sampleCatalog: [
    { id: 1, title: "Neon Movie", year: 2024, type: "Movie", genre: "Sci-Fi" },
    { id: 2, title: "Other Film", year: 2023, type: "Movie", genre: "Drama" },
  ],
}));

describe("MoviesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";

        if (method === "GET") {
          return new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        if (method === "DELETE") {
          return new Response(null, { status: 204 });
        }

        return new Response(JSON.stringify({ item: { catalogId: 1, status: "plan-to-watch" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null for guest users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    const { container } = render(<MoviesPage />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the movies search page when signed in", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "Jane Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<MoviesPage />);
    await screen.findByText(/your list is empty/i);
    expect(screen.getByText(/Movies & TV/i)).toBeDefined();
    expect(screen.getByLabelText(/Search sample catalog/i)).toBeDefined();
  });

  it("allows searching for movies", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "Jane Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<MoviesPage />);
    await screen.findByText(/your list is empty/i);
    
    const searchInput = screen.getByLabelText(/Search sample catalog/i);
    fireEvent.change(searchInput, { target: { value: "Neon" } });

    expect(screen.getByText(/Neon Movie/i)).toBeDefined();
    expect(screen.queryByText(/Other Film/i)).toBeNull();
  });

  it("adds and removes movies from the list", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "Jane Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<MoviesPage />);
    await screen.findByText(/your list is empty/i);
    
    // Add the first movie found
    const addButtons = screen.getAllByRole("button", { name: /add to my list/i });
    fireEvent.click(addButtons[0]);

    // Check if it appears in "My List"
    await waitFor(() => {
      expect(screen.getByText((content) => {
        return content.includes("1") && content.includes("title") && content.includes("added");
      })).toBeDefined();
    });
    
    // Remove it
    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    // Check if list is empty again
    await waitFor(() => {
      expect(screen.getByText(/your list is empty/i)).toBeDefined();
    });
  });
});

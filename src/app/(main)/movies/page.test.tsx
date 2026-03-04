import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MoviesPage from "./page";

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
  });

  it("renders the movies search page", () => {
    render(<MoviesPage />);
    expect(screen.getByText(/Movies & TV/i)).toBeDefined();
    expect(screen.getByLabelText(/Search sample catalog/i)).toBeDefined();
  });

  it("allows searching for movies", async () => {
    render(<MoviesPage />);
    
    const searchInput = screen.getByLabelText(/Search sample catalog/i);
    fireEvent.change(searchInput, { target: { value: "Neon" } });

    expect(screen.getByText(/Neon Movie/i)).toBeDefined();
    expect(screen.queryByText(/Other Film/i)).toBeNull();
  });

  it("adds and removes movies from the list", () => {
    render(<MoviesPage />);
    
    // Add the first movie found
    const addButtons = screen.getAllByRole("button", { name: /add to my list/i });
    fireEvent.click(addButtons[0]);

    // Check if it appears in "My List"
    expect(screen.getByText((content) => {
      return content.includes("1") && content.includes("title") && content.includes("added");
    })).toBeDefined();
    
    // Remove it
    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    // Check if list is empty again
    expect(screen.getByText(/your list is empty/i)).toBeDefined();
  });
});

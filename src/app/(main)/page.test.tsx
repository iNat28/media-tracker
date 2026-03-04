import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "./page";
import { authClient } from "@/lib/auth-client";

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

describe("Home Page", () => {
  it("renders correctly for guest users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<Home />);
    
    expect(screen.getByText(/Track what you are watching/i)).toBeDefined();
    expect(screen.queryByText(/Signed in as/i)).toBeNull();
  });

  it("renders correctly for signed in users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "John Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<Home />);
    
    expect(screen.getByText(/John Doe/i)).toBeDefined();
    expect(screen.getByText(/Signed in as/i)).toBeDefined();
  });
});

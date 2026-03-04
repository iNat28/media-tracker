import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Navbar } from "./Navbar";
import { authClient } from "@/lib/auth-client";

// Mock authClient
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign in link for guest users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<Navbar />);
    
    expect(screen.getByRole("link", { name: /sign in/i })).toBeDefined();
    expect(screen.queryByText(/Hello,/i)).toBeNull();
  });

  it("renders user name and sign out button for signed in users", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "Jane Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<Navbar />);
    
    expect(screen.getByText(/Hello, Jane Doe/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeDefined();
  });

  it("calls signOut when clicking sign out button", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: { name: "Jane Doe" },
      },
      isPending: false,
    } as unknown as ReturnType<typeof authClient.useSession>);

    render(<Navbar />);
    
    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(authClient.signOut).toHaveBeenCalled();
  });
});

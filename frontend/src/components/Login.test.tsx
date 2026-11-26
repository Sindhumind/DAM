// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Login from "./Login";
import * as authService from "../services/authService";

vi.mock("../services/authService", () => ({
    login: vi.fn(),
}));

describe("Login", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("toggles password visibility when clicking the eye button", () => {
        render(<Login onLoginSuccess={vi.fn()} />);

        const passwordInput = screen.getByLabelText("Password");
        expect(passwordInput).toHaveAttribute("type", "password");

        const toggleButton = screen.getByRole("button", { name: "Show password" });
        fireEvent.click(toggleButton);

        expect(passwordInput).toHaveAttribute("type", "text");
        expect(
            screen.getByRole("button", { name: "Hide password" }),
        ).toBeInTheDocument();
    });

    it("submits trimmed credentials and calls onLoginSuccess on valid login", async () => {
        const onLoginSuccess = vi.fn();
        vi.mocked(authService.login).mockResolvedValueOnce(
            {} as Awaited<ReturnType<typeof authService.login>>,
        );

        render(<Login onLoginSuccess={onLoginSuccess} />);

        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "  user@company.com  " },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "Secret123!" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith(
                "user@company.com",
                "Secret123!",
            );
            expect(onLoginSuccess).toHaveBeenCalledTimes(1);
        });
    });

    it("displays an accessible error alert when login fails", async () => {
        vi.mocked(authService.login).mockRejectedValueOnce(
            new Error("Invalid email or password"),
        );

        render(<Login onLoginSuccess={vi.fn()} />);

        fireEvent.change(screen.getByLabelText("Email address"), {
            target: { value: "user@company.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { value: "wrongpass" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

        const alert = await screen.findByRole("alert");
        expect(alert).toHaveTextContent("Invalid email or password");
    });
});
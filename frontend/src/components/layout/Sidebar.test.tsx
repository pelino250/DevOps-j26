import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  test("renders navigation menu", () => {
    render(
      <BrowserRouter>
        <Sidebar open={true} onToggle={() => {}} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Vehicles")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  test("applies open state styles when open prop is true", () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar open={true} onToggle={() => {}} />
      </BrowserRouter>,
    );

    const overlay = container.querySelector(".fixed.inset-0") as HTMLElement;
    const sidebar = overlay?.nextElementSibling as HTMLElement;
    expect(sidebar?.className).toContain("translate-x-0");
  });

  test("applies closed state styles when open prop is false", () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar open={false} onToggle={() => {}} />
      </BrowserRouter>,
    );

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar.className).toContain("-translate-x-full");
  });

  test("highlights active navigation item", () => {
    render(
      <BrowserRouter>
        <Sidebar open={true} onToggle={() => {}} />
      </BrowserRouter>,
    );

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-primary");
  });

  test("renders all navigation items", () => {
    render(
      <BrowserRouter>
        <Sidebar open={true} onToggle={() => {}} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Vehicles")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});

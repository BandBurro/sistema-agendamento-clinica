import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/StatusBadge";

describe("StatusBadge", () => {
  it("renders the correct label for REQUESTED", () => {
    render(<StatusBadge status="REQUESTED" />);
    expect(screen.getByText("Solicitado")).toBeInTheDocument();
  });

  it("renders the correct label for SCHEDULED", () => {
    render(<StatusBadge status="SCHEDULED" />);
    expect(screen.getByText("Agendado")).toBeInTheDocument();
  });

  it("renders the correct label for IN_PROGRESS", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("Em Atendimento")).toBeInTheDocument();
  });

  it("renders the correct label for COMPLETED", () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText("Concluído")).toBeInTheDocument();
  });

  it("renders the correct label for CANCELLED", () => {
    render(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("applies additional className", () => {
    const { container } = render(
      <StatusBadge status="SCHEDULED" className="extra-class" />
    );
    expect(container.firstChild).toHaveClass("extra-class");
  });
});

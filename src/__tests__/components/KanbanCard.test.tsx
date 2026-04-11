import { render, screen, fireEvent } from "@testing-library/react";
import { KanbanCard } from "@/components/kanban/KanbanCard";

// Mock dnd-kit hooks
jest.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

const mockAppointment = {
  id: "appt-1",
  patientId: "pat-1",
  dentistId: "dent-1",
  date: new Date("2026-04-15"),
  startTime: new Date("1970-01-01T09:00:00"),
  endTime: new Date("1970-01-01T10:00:00"),
  status: "SCHEDULED" as const,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: {
    id: "pat-1",
    phone: "+5511999990001",
    user: { id: "u1", name: "João Lima", email: "joao@test.com" },
  },
  dentist: {
    id: "dent-1",
    specialty: "Clínica Geral",
    user: { id: "u2", name: "Dr. Ana Silva", email: "ana@clinica.com" },
  },
};

describe("KanbanCard", () => {
  it("renders patient name", () => {
    render(<KanbanCard appointment={mockAppointment} onClick={jest.fn()} />);
    expect(screen.getByText("João Lima")).toBeInTheDocument();
  });

  it("renders dentist name", () => {
    render(<KanbanCard appointment={mockAppointment} onClick={jest.fn()} />);
    expect(screen.getByText("Dr. Ana Silva")).toBeInTheDocument();
  });

  it("renders the appointment date", () => {
    render(<KanbanCard appointment={mockAppointment} onClick={jest.fn()} />);
    expect(screen.getByText(/abr/i)).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const handleClick = jest.fn();
    render(<KanbanCard appointment={mockAppointment} onClick={handleClick} />);
    fireEvent.click(screen.getByText("João Lima"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

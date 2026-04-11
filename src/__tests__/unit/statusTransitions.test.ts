import { VALID_TRANSITIONS, STATUS_LABELS } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";

describe("VALID_TRANSITIONS", () => {
  it("REQUESTED can move to SCHEDULED or CANCELLED", () => {
    expect(VALID_TRANSITIONS.REQUESTED).toContain("SCHEDULED");
    expect(VALID_TRANSITIONS.REQUESTED).toContain("CANCELLED");
    expect(VALID_TRANSITIONS.REQUESTED).not.toContain("COMPLETED");
  });

  it("SCHEDULED can move to REQUESTED, IN_PROGRESS or CANCELLED", () => {
    expect(VALID_TRANSITIONS.SCHEDULED).toContain("REQUESTED");
    expect(VALID_TRANSITIONS.SCHEDULED).toContain("IN_PROGRESS");
    expect(VALID_TRANSITIONS.SCHEDULED).toContain("CANCELLED");
    expect(VALID_TRANSITIONS.SCHEDULED).not.toContain("COMPLETED");
  });

  it("IN_PROGRESS can move to SCHEDULED, COMPLETED or CANCELLED", () => {
    expect(VALID_TRANSITIONS.IN_PROGRESS).toContain("SCHEDULED");
    expect(VALID_TRANSITIONS.IN_PROGRESS).toContain("COMPLETED");
    expect(VALID_TRANSITIONS.IN_PROGRESS).toContain("CANCELLED");
    expect(VALID_TRANSITIONS.IN_PROGRESS).not.toContain("REQUESTED");
  });

  it("COMPLETED can move back to IN_PROGRESS", () => {
    expect(VALID_TRANSITIONS.COMPLETED).toContain("IN_PROGRESS");
  });

  it("CANCELLED can be reopened to REQUESTED", () => {
    expect(VALID_TRANSITIONS.CANCELLED).toContain("REQUESTED");
  });

  it("enforces the full happy path: REQUESTED → SCHEDULED → IN_PROGRESS → COMPLETED", () => {
    const path: AppointmentStatus[] = [
      "REQUESTED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
    ];

    for (let i = 0; i < path.length - 1; i++) {
      expect(VALID_TRANSITIONS[path[i]]).toContain(path[i + 1]);
    }
  });
});

describe("STATUS_LABELS", () => {
  it("has a label for every status", () => {
    const statuses: AppointmentStatus[] = [
      "REQUESTED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ];
    statuses.forEach((s) => {
      expect(STATUS_LABELS[s]).toBeTruthy();
      expect(typeof STATUS_LABELS[s]).toBe("string");
    });
  });
});

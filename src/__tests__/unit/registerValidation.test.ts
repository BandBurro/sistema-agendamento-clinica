import { registerSchema } from "@/lib/validations/auth";

const validData = {
  name: "João Lima",
  email: "joao@test.com",
  password: "Password1",
  confirmPassword: "Password1",
  phone: "+5511999990001",
  dateOfBirth: "1990-01-01",
};

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(registerSchema.safeParse({}).success).toBe(false);
    expect(registerSchema.safeParse({ name: "João" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validData, email: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validData, password: "" }).success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...validData, password: "Pass1", confirmPassword: "Pass1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.password ?? [];
      expect(msgs.some((m) => /8/i.test(m))).toBe(true);
    }
  });

  it("rejects password without an uppercase letter", () => {
    const result = registerSchema.safeParse({ ...validData, password: "password1", confirmPassword: "password1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.password ?? [];
      expect(msgs.some((m) => /maiúscula/i.test(m))).toBe(true);
    }
  });

  it("rejects password without a number", () => {
    const result = registerSchema.safeParse({ ...validData, password: "Passwordonly", confirmPassword: "Passwordonly" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.password ?? [];
      expect(msgs.some((m) => /número/i.test(m))).toBe(true);
    }
  });

  it("rejects mismatched confirm password", () => {
    const result = registerSchema.safeParse({ ...validData, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.confirmPassword ?? [];
      expect(msgs.some((m) => /conferem/i.test(m))).toBe(true);
    }
  });

  it("rejects invalid email format", () => {
    const result = registerSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.email ?? [];
      expect(msgs.length).toBeGreaterThan(0);
    }
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...validData, name: "J" });
    expect(result.success).toBe(false);
  });
});

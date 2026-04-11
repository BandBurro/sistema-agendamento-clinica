// Tests for registration validation logic (extracted from the API route)

function validateRegistration(body: Record<string, unknown>) {
  const { name, email, password, phone, dateOfBirth } = body;

  if (!name || !email || !password || !phone || !dateOfBirth) {
    return { valid: false, error: "Todos os campos são obrigatórios." };
  }

  if (typeof password === "string" && password.length < 6) {
    return { valid: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email === "string" && !emailRegex.test(email)) {
    return { valid: false, error: "Email inválido." };
  }

  return { valid: true, error: null };
}

describe("validateRegistration", () => {
  it("rejects missing fields", () => {
    expect(validateRegistration({}).valid).toBe(false);
    expect(validateRegistration({ name: "João" }).valid).toBe(false);
    expect(validateRegistration({ name: "João", email: "a@b.com" }).valid).toBe(false);
  });

  it("rejects password shorter than 6 chars", () => {
    const result = validateRegistration({
      name: "João",
      email: "joao@test.com",
      password: "123",
      phone: "+5511999990001",
      dateOfBirth: "1990-01-01",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/senha/i);
  });

  it("rejects invalid email format", () => {
    const result = validateRegistration({
      name: "João",
      email: "not-an-email",
      password: "password123",
      phone: "+5511999990001",
      dateOfBirth: "1990-01-01",
    });
    expect(result.valid).toBe(false);
  });

  it("accepts valid registration data", () => {
    const result = validateRegistration({
      name: "João Lima",
      email: "joao@test.com",
      password: "password123",
      phone: "+5511999990001",
      dateOfBirth: "1990-01-01",
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });
});

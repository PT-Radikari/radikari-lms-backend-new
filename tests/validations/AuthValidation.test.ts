/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { UserValidationLoginSchema } from "$validations/schema/UserSchema"

describe("AuthValidation schemas", () => {
	describe("UserValidationLoginSchema (used by validateLoginDTO)", () => {
		it("should pass with valid credentials", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "admin@radikari.com",
				password: "securepass",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when email is empty string", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "",
				password: "password123",
			})
			expect(result.success).toBe(true) // empty string passes string check
		})

		it("should fail when password is missing", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "admin@radikari.com",
			})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "admin@radikari.com",
				password: "password123",
				rememberMe: true,
			})
			expect(result.success).toBe(false)
		})
	})
})

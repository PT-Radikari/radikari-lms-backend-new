/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { UserValidationLoginSchema, UserValidationCreateSchema, UserValidationUpdateSchema } from "$validations/schema/UserSchema"

describe("UserValidation schemas", () => {
	describe("UserValidationLoginSchema", () => {
		it("should pass with valid email and password", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "test@example.com",
				password: "password123",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when email is missing", () => {
			const result = UserValidationLoginSchema.safeParse({ password: "password123" })
			expect(result.success).toBe(false)
		})

		it("should fail when password is missing", () => {
			const result = UserValidationLoginSchema.safeParse({ email: "test@example.com" })
			expect(result.success).toBe(false)
		})

		it("should fail when password is too short", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "test@example.com",
				password: "1234",
			})
			expect(result.success).toBe(false)
		})

		it("should fail with extra fields", () => {
			const result = UserValidationLoginSchema.safeParse({
				email: "test@example.com",
				password: "password123",
				extraField: "not allowed",
			})
			expect(result.success).toBe(false)
		})
	})

	describe("UserValidationCreateSchema", () => {
		it("should pass with valid data", () => {
			const result = UserValidationCreateSchema.safeParse({
				fullName: "John Doe",
				email: "john@example.com",
				password: "password123",
				phoneNumber: "081234567890",
			})
			expect(result.success).toBe(true)
		})

		it("should pass with optional fields omitted", () => {
			const result = UserValidationCreateSchema.safeParse({
				fullName: "John Doe",
				email: "john@example.com",
				phoneNumber: "081234567890",
			})
			expect(result.success).toBe(true)
		})

		it("should fail when fullName is too short", () => {
			const result = UserValidationCreateSchema.safeParse({
				fullName: "John",
				email: "john@example.com",
				phoneNumber: "081234567890",
			})
			expect(result.success).toBe(false)
		})

		it("should fail when phoneNumber is too short", () => {
			const result = UserValidationCreateSchema.safeParse({
				fullName: "John Doe",
				email: "john@example.com",
				phoneNumber: "123456",
			})
			expect(result.success).toBe(false)
		})

		it("should allow empty string password", () => {
			const result = UserValidationCreateSchema.safeParse({
				fullName: "John Doe",
				email: "john@example.com",
				password: "",
				phoneNumber: "081234567890",
			})
			expect(result.success).toBe(true)
		})
	})

	describe("UserValidationUpdateSchema", () => {
		it("should pass with partial update", () => {
			const result = UserValidationUpdateSchema.safeParse({ fullName: "Jane Doe" })
			expect(result.success).toBe(true)
		})

		it("should pass with email (optional string field)", () => {
			const result = UserValidationUpdateSchema.safeParse({
				fullName: "Jane Doe",
				email: "jane@example.com",
			})
			expect(result.success).toBe(true)
		})

		it("should fail with truly extra fields", () => {
			const result = UserValidationUpdateSchema.safeParse({
				fullName: "Jane Doe",
				extraField: "not allowed",
			})
			expect(result.success).toBe(false)
		})

		it("should fail when fullName is too short", () => {
			const result = UserValidationUpdateSchema.safeParse({ fullName: "Jane" })
			expect(result.success).toBe(false)
		})
	})
})

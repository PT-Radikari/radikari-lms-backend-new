/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

jest.mock("$repositories/UserRepository", () => {
	const mockGetByEmail = jest.fn<any>()
	const mockGetById = jest.fn<any>()
	const mockUpdatePassword = jest.fn<any>()
	const mockCreateGoogleUser = jest.fn<any>()
	const mockUpdate = jest.fn<any>()
	return {
		getByEmail: mockGetByEmail,
		getById: mockGetById,
		updatePassword: mockUpdatePassword,
		createGoogleUser: mockCreateGoogleUser,
		update: mockUpdate,
	}
})

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

jest.mock("jsonwebtoken", () => ({
	verify: jest.fn(),
	sign: jest.fn(() => "mock-jwt-token"),
}))

import { logIn, verifyToken, changePassword } from "$services/AuthService"
import { Roles, UserType } from "$generated/prisma/client"
import jwt from "jsonwebtoken"

describe("AuthService", () => {
	describe("logIn", () => {
		// NOTE: Bun.password.verify cannot be mocked in Jest (Bun-specific API).
		// These tests are skipped as they require Bun runtime to function.
		it.skip("should return success with token on valid credentials", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJf8XG2u", // "password123"
				fullName: "Test User",
				role: Roles.USER,
				type: UserType.INTERNAL,
				isActive: true,
			}
			mocks.getByEmail.mockResolvedValue(mockUser)

			const result = await logIn({
				email: "test@example.com",
				password: "password123",
			})

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("token")
			expect(result.data).toHaveProperty("user")
		})

		it("should return error when user not found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getByEmail.mockResolvedValue(null)

			const result = await logIn({
				email: "nonexistent@example.com",
				password: "password123",
			})

			expect(result.status).toBe(false)
		})

		it("should return error when user is inactive", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getByEmail.mockResolvedValue({
				id: "user-123",
				email: "test@example.com",
				password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJf8XG2u",
				role: Roles.USER,
				type: UserType.INTERNAL,
				isActive: false,
			})

			const result = await logIn({
				email: "test@example.com",
				password: "password123",
			})

			expect(result.status).toBe(false)
		})

		it.skip("should return error when password is incorrect", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJf8XG2u",
				role: Roles.USER,
				type: UserType.INTERNAL,
				isActive: true,
			}
			mocks.getByEmail.mockResolvedValue(mockUser)

			const result = await logIn({
				email: "test@example.com",
				password: "wrongpassword",
			})

			expect(result.status).toBe(false)
		})
	})

	describe("verifyToken", () => {
		it("should return success with user data on valid token", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJf8XG2u",
				fullName: "Test User",
				role: Roles.USER,
			}
			mocks.getById.mockResolvedValue(mockUser)
			;(jwt.verify as jest.Mock).mockReturnValue({ id: "user-123" })

			const result = await verifyToken("valid_token")

			expect(result.status).toBe(true)
			expect(result.data).toHaveProperty("user")
			expect(result.data).toHaveProperty("token")
		})

		it("should return error when user not found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getById.mockResolvedValue(null)
			;(jwt.verify as jest.Mock).mockReturnValue({ id: "user-123" })

			const result = await verifyToken("valid_token")

			expect(result.status).toBe(false)
		})
	})

	describe("changePassword", () => {
		// NOTE: Bun.password.verify/hash cannot be mocked in Jest (Bun-specific API).
		it.skip("should return success when password changed successfully", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			const mockUser = {
				id: "user-123",
				email: "test@example.com",
				password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfZJf8XG2u",
				role: Roles.USER,
				type: UserType.INTERNAL,
				isActive: true,
			}
			mocks.getById.mockResolvedValue(mockUser)
			mocks.updatePassword.mockResolvedValue(undefined)

			const result = await changePassword(
				"user-123",
				"oldpassword",
				"newpassword",
			)

			expect(result.status).toBe(true)
			expect(mocks.updatePassword).toHaveBeenCalled()
		})

		it("should return error when user not found", async () => {
			const mocks = jest.requireMock("$repositories/UserRepository") as any
			mocks.getById.mockResolvedValue(null)

			const result = await changePassword(
				"nonexistent-user",
				"oldpassword",
				"newpassword",
			)

			expect(result.status).toBe(false)
		})
	})
})

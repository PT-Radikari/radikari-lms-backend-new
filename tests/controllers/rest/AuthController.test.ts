/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUser } from "$factories/user"

let mockLogIn = jest.fn<any>()
let mockVerifyToken = jest.fn<any>()
let mockChangePassword = jest.fn<any>()
let mockGoogleCallback = jest.fn<any>()
let mockGenerateAuthUrl = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/AuthService", () => ({
	logIn: (...args: any[]) => mockLogIn(...args),
	verifyToken: (...args: any[]) => mockVerifyToken(...args),
	changePassword: (...args: any[]) => mockChangePassword(...args),
	googleCallback: (...args: any[]) => mockGoogleCallback(...args),
}))

jest.mock("$pkg/oauth/google", () => ({
	googleOAuth: {
		generateAuthUrl: (...args: any[]) => mockGenerateAuthUrl(...args),
	},
}))

import * as AuthController from "$controllers/rest/AuthController"

describe("AuthController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("login", () => {
		it("should return 200 on successful login", async () => {
			const loginData = { user: { id: "user-1", email: "test@example.com" }, token: "jwt-token-123" }
			mockLogIn.mockResolvedValue({
				status: true,
				data: loginData,
			})

			const { mock, spy } = createMockContext({
				body: { email: "test@example.com", password: "password123" },
			})

			await AuthController.login(mock)

			expect(mockLogIn).toHaveBeenCalledWith({
				email: "test@example.com",
				password: "password123",
			})
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: loginData,
				message: "Successfully Logged In!",
			})
		})

		it("should return error response on service failure", async () => {
			mockLogIn.mockResolvedValue({
				status: false,
				err: { message: "Invalid credential!", code: 404 },
			})

			const { mock, spy } = createMockContext({
				body: { email: "test@example.com", password: "wrongpassword" },
			})

			await AuthController.login(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid credential!",
			})
		})
	})

	describe("verifyToken", () => {
		it("should return 200 on successful token verification", async () => {
			const tokenData = { user: { id: "user-1" }, token: "jwt-token-123" }
			mockVerifyToken.mockResolvedValue({
				status: true,
				data: tokenData,
			})

			const { mock, spy } = createMockContext({
				body: { token: "jwt-token-123" },
			})

			await AuthController.verifyToken(mock)

			expect(mockVerifyToken).toHaveBeenCalledWith("jwt-token-123")
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: tokenData,
				message: "Token Verified!",
			})
		})

		it("should return error response on service failure", async () => {
			mockVerifyToken.mockResolvedValue({
				status: false,
				err: { message: "Invalid Token", code: 403 },
			})

			const { mock, spy } = createMockContext({
				body: { token: "invalid-token" },
			})

			await AuthController.verifyToken(mock)

			// handleServiceErrorWithResponse falls through to 500 for unknown codes like 403
			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid Token",
			})
		})
	})

	describe("changePassword", () => {
		it("should return 200 on successful password change", async () => {
			mockChangePassword.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				body: { oldPassword: "oldpass123", newPassword: "newpass123" },
				jwtPayload: mockUser,
			})

			await AuthController.changePassword(mock)

			expect(mockChangePassword).toHaveBeenCalledWith(
				mockUser.id,
				"oldpass123",
				"newpass123",
			)
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully changed password!",
			})
		})

		it("should return 400 when newPassword is missing", async () => {
			const { mock, spy } = createMockContext({
				body: { oldPassword: "oldpass123" },
				jwtPayload: mockUser,
			})

			await AuthController.changePassword(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid Fields",
				errors: ["newPassword is required"],
			})
		})

		it("should return 400 when oldPassword is missing", async () => {
			const { mock, spy } = createMockContext({
				body: { newPassword: "newpass123" },
				jwtPayload: mockUser,
			})

			await AuthController.changePassword(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid Fields",
				errors: ["oldPassword is required"],
			})
		})

		it("should return 400 when both passwords are missing", async () => {
			const { mock, spy } = createMockContext({
				body: {},
				jwtPayload: mockUser,
			})

			await AuthController.changePassword(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid Fields",
				errors: expect.arrayContaining([
					"newPassword is required",
					"oldPassword is required",
				]),
			})
		})

		it("should return error response on service failure", async () => {
			mockChangePassword.mockResolvedValue({
				status: false,
				err: { message: "Incorrect Old Password!", code: 400 },
			})

			const { mock, spy } = createMockContext({
				body: { oldPassword: "wrongoldpass", newPassword: "newpass123" },
				jwtPayload: mockUser,
			})

			await AuthController.changePassword(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Incorrect Old Password!",
			})
		})
	})

	describe("googleLogin", () => {
		it("should redirect to Google OAuth URL", () => {
			const authUrl = "https://accounts.google.com/o/oauth2/auth?client_id=test"
			mockGenerateAuthUrl.mockReturnValue(authUrl)

			const redirectSpy = jest.fn()
			const { mock } = createMockContext({})

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(mock as any).redirect = redirectSpy

			AuthController.googleLogin(mock as any)

			expect(mockGenerateAuthUrl).toHaveBeenCalledWith({
				access_type: "offline",
				scope: expect.arrayContaining([
					"https://www.googleapis.com/auth/userinfo.email",
					"https://www.googleapis.com/auth/userinfo.profile",
				]),
				include_granted_scopes: true,
			})
			expect(redirectSpy).toHaveBeenCalledWith(authUrl)
		})
	})

	describe("googleCallback", () => {
		const originalEnv = process.env

		beforeEach(() => {
			process.env = { ...originalEnv, FRONTEND_URL: "http://localhost:3000" }
			jest.clearAllMocks()
		})

		afterEach(() => {
			process.env = originalEnv
		})

		it("should redirect with token and user on successful callback", async () => {
			const callbackData = {
				token: "google-jwt-token-123",
				user: { id: "user-1", email: "test@example.com", fullName: "Test User" },
			}
			mockGoogleCallback.mockResolvedValue({
				status: true,
				data: callbackData,
			})

			const redirectSpy = jest.fn()
			const { mock } = createMockContext({
				query: { code: "google-auth-code-123" },
			})

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(mock as any).redirect = redirectSpy

			await AuthController.googleCallback(mock as any)

			expect(mockGoogleCallback).toHaveBeenCalledWith(
				"google-auth-code-123",
			)
			expect(redirectSpy).toHaveBeenCalledWith(
				expect.stringContaining("http://localhost:3000/login"),
			)
		})

		it("should redirect to fallback URL when FRONTEND_URL is not set", async () => {
			delete process.env.FRONTEND_URL
			const callbackData = {
				token: "google-jwt-token-123",
				user: { id: "user-1", email: "test@example.com" },
			}
			mockGoogleCallback.mockResolvedValue({
				status: true,
				data: callbackData,
			})

			const redirectSpy = jest.fn()
			const { mock } = createMockContext({
				query: { code: "google-auth-code-123" },
			})

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(mock as any).redirect = redirectSpy

			await AuthController.googleCallback(mock as any)

			expect(redirectSpy).toHaveBeenCalledWith(
				expect.stringContaining("http://localhost:3000/login"),
			)
		})

		it("should return error response on service failure", async () => {
			mockGoogleCallback.mockResolvedValue({
				status: false,
				err: { message: "Invalid Google Token", code: 400 },
			})

			const { mock, spy } = createMockContext({
				query: { code: "invalid-google-code" },
			})

			await AuthController.googleCallback(mock as any)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid Google Token",
			})
		})
	})
})

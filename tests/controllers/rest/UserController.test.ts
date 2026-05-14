/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUser } from "$factories/user"
import { mockUserJWT } from "$factories/assignment"

let mockGetAll = jest.fn<any>()
let mockGetById = jest.fn<any>()
let mockUpdate = jest.fn<any>()
let mockDeleteById = jest.fn<any>()
let mockRestoreById = jest.fn<any>()
let mockGetMe = jest.fn<any>()

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/UserService", () => ({
	getAll: (...args: any[]) => mockGetAll(...args),
	getById: (...args: any[]) => mockGetById(...args),
	update: (...args: any[]) => mockUpdate(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
	restoreById: (...args: any[]) => mockRestoreById(...args),
	getMe: (...args: any[]) => mockGetMe(...args),
}))

import * as UserController from "$controllers/rest/UserController"

describe("UserController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getAll", () => {
		it("should return 200 with paginated data on success", async () => {
			const paginatedData = {
				data: [mockUser],
				page: 1,
				limit: 10,
				total: 1,
			}
			mockGetAll.mockResolvedValue({
				status: true,
				data: paginatedData,
			})

			const { mock, spy } = createMockContext({
				query: { page: "1", limit: "10" },
				jwtPayload: mockUserJWT,
			})

			await UserController.getAll(mock)

			expect(mockGetAll).toHaveBeenCalled()
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: paginatedData,
				message: "Successfully fetched all User!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { message: "Unauthorized", code: 401 },
			})

			const { mock, spy } = createMockContext({
				query: {},
				jwtPayload: mockUserJWT,
			})

			await UserController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(401)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Unauthorized",
			})
		})
	})

	describe("getById", () => {
		it("should return 200 with user data on success", async () => {
			const userData = { ...mockUser, password: undefined }
			mockGetById.mockResolvedValue({
				status: true,
				data: userData,
			})

			const { mock, spy } = createMockContext({
				params: { id: "user-test-123" },
			})

			await UserController.getById(mock)

			expect(mockGetById).toHaveBeenCalledWith("user-test-123")
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: userData,
				message: "Successfully fetched user by id!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { message: "User not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
			})

			await UserController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "User not found",
			})
		})
	})

	describe("update", () => {
		it("should return 200 on successful update", async () => {
			const updatedUser = { ...mockUser, fullName: "Updated Name" }
			mockUpdate.mockResolvedValue({
				status: true,
				data: updatedUser,
			})

			const { mock, spy } = createMockContext({
				params: { id: "user-test-123" },
				body: { fullName: "Updated Name" },
			})

			await UserController.update(mock)

			expect(mockUpdate).toHaveBeenCalledWith("user-test-123", {
				fullName: "Updated Name",
			})
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: updatedUser,
				message: "Successfully updated User!",
			})
		})

		it("should return error response on service failure", async () => {
			mockUpdate.mockResolvedValue({
				status: false,
				err: { message: "Invalid ID", code: 400 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "invalid-id" },
				body: { fullName: "Updated" },
			})

			await UserController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Invalid ID",
			})
		})
	})

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "user-test-123" },
			})

			await UserController.deleteById(mock)

			expect(mockDeleteById).toHaveBeenCalledWith("user-test-123")
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully deleted User!",
			})
		})

		it("should return error response on service failure", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { message: "User not found", code: 404 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent-id" },
			})

			await UserController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "User not found",
			})
		})
	})

	describe("restoreById", () => {
		it("should return 200 on successful restoration", async () => {
			mockRestoreById.mockResolvedValue({
				status: true,
				data: {},
			})

			const { mock, spy } = createMockContext({
				params: { id: "user-test-123" },
			})

			await UserController.restoreById(mock)

			expect(mockRestoreById).toHaveBeenCalledWith("user-test-123")
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: {},
				message: "Successfully restored User!",
			})
		})

		it("should return error response on service failure", async () => {
			mockRestoreById.mockResolvedValue({
				status: false,
				err: { message: "Internal Server Error", code: 500 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "user-test-123" },
			})

			await UserController.restoreById(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Internal Server Error",
			})
		})
	})

	describe("me", () => {
		it("should return 200 with current user data on success", async () => {
			const meData = {
				id: mockUser.id,
				email: mockUser.email,
				fullName: mockUser.fullName,
				role: mockUser.role,
				type: mockUser.type,
				tenantUserCount: 1,
				tenantUser: [{ id: "tu-1", tenantId: "tenant-1", tenantRoleId: "role-1" }],
			}
			mockGetMe.mockResolvedValue({
				status: true,
				data: meData,
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await UserController.me(mock)

			expect(mockGetMe).toHaveBeenCalledWith(mockUserJWT.id)
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: meData,
				message: "Successfully fetched current user!",
			})
		})

		it("should return error response on service failure", async () => {
			mockGetMe.mockResolvedValue({
				status: false,
				err: { message: "User not found", code: 400 },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await UserController.me(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "User not found",
			})
		})
	})
})

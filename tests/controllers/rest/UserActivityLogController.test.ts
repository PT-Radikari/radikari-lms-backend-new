/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockGetAll = jest.fn<any>()
let mockGetById = jest.fn<any>()

jest.mock("$services/UserActivityLogService", () => ({
	getAll: (...args: any[]) => mockGetAll(...args),
	getById: (...args: any[]) => mockGetById(...args),
}))

import * as UserActivityLogController from "$controllers/rest/UserActivityLogController"
import { createMockContext } from "$tests/helpers/mockContext"

describe("UserActivityLogController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── getAll ─────────────────────────────────────────────────────────────

	describe("getAll", () => {
		it("should return 200 with paginated logs on success", async () => {
			mockGetAll.mockResolvedValue({
				status: true,
				data: { data: [], total: 0 },
			})

			const { mock, spy } = createMockContext({
				query: {},
			})

			await UserActivityLogController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all UserActivityLog!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				query: {},
			})

			await UserActivityLogController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getById ───────────────────────────────────────────────────────────

	describe("getById", () => {
		it("should return 200 with log on success", async () => {
			const mockLog = {
				id: "log-123",
				userId: "user-123",
				action: "LOGIN",
			}
			mockGetById.mockResolvedValue({ status: true, data: mockLog })

			const { mock, spy } = createMockContext({
				params: { id: "log-123" },
			})

			await UserActivityLogController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched UserActivityLog by id!",
			})
		})

		it("should return 404 when log not found", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Log not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent" },
			})

			await UserActivityLogController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})
})

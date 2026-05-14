/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockGetAllByTenant = jest.fn<any>()
let mockGetStatusInTenant = jest.fn<any>()
let mockMarkViewedInTenant = jest.fn<any>()

jest.mock("$services/UserKnowledgeReadLogService", () => ({
	getAllByTenant: (...args: any[]) => mockGetAllByTenant(...args),
	getStatusInTenant: (...args: any[]) => mockGetStatusInTenant(...args),
	markViewedInTenant: (...args: any[]) => mockMarkViewedInTenant(...args),
}))

import * as UserKnowledgeReadLogController from "$controllers/rest/UserKnowledgeReadLogController"

describe("UserKnowledgeReadLogController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── getAll ─────────────────────────────────────────────────────────────

	describe("getAll", () => {
		it("should return 200 with read logs on success", async () => {
			mockGetAllByTenant.mockResolvedValue({
				status: true,
				data: { data: [], total: 0 },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				query: {},
			})

			await UserKnowledgeReadLogController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched knowledge read logs",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAllByTenant.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				query: {},
			})

			await UserKnowledgeReadLogController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getStatus ───────────────────────────────────────────────────────

	describe("getStatus", () => {
		it("should return 200 with read status on success", async () => {
			const mockStatus = { knowledgeId: "know-123", isViewed: true, viewedAt: new Date() }
			mockGetStatusInTenant.mockResolvedValue({ status: true, data: mockStatus })

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123", knowledgeId: "know-123" },
				jwtPayload: mockUserJWT,
			})

			await UserKnowledgeReadLogController.getStatus(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched read status",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetStatusInTenant.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Knowledge not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123", knowledgeId: "nonexistent" },
				jwtPayload: mockUserJWT,
			})

			await UserKnowledgeReadLogController.getStatus(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── markViewed ─────────────────────────────────────────────────────

	describe("markViewed", () => {
		it("should return 200 on successful mark viewed", async () => {
			mockMarkViewedInTenant.mockResolvedValue({
				status: true,
				data: { knowledgeId: "know-123", userId: "user-123" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { knowledgeId: "know-123" },
			})

			await UserKnowledgeReadLogController.markViewed(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Knowledge marked as viewed",
			})
		})

		it("should return error status when service fails", async () => {
			mockMarkViewedInTenant.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Mark viewed failed" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { knowledgeId: "know-123" },
			})

			await UserKnowledgeReadLogController.markViewed(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})
})

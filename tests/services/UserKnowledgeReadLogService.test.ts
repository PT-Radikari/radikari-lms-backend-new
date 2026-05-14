/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
	getAllByTenant,
	getStatusInTenant,
	markViewedInTenant,
} from "$services/UserKnowledgeReadLogService"

const mockGetAllByTenant = jest.fn<any>()
const mockGetByUserAndKnowledge = jest.fn<any>()
const mockUpsertView = jest.fn<any>()
const mockFindFirst = jest.fn<any>()
const mockLoggerInfo = jest.fn<any>()
const mockLoggerError = jest.fn<any>()

jest.mock("$repositories/UserKnowledgeReadLogRepository", () => ({
	getAllByTenant: (...args: any[]) => mockGetAllByTenant(...args),
	getByUserAndKnowledge: (...args: any[]) => mockGetByUserAndKnowledge(...args),
	upsertView: (...args: any[]) => mockUpsertView(...args),
}))

jest.mock("$pkg/prisma", () => ({
	prisma: {
		knowledge: {
			findFirst: (...args: any[]) => mockFindFirst(...args),
		},
	},
}))

jest.mock("$pkg/logger", () => ({
	default: {
		info: (...args: any[]) => mockLoggerInfo(...args),
		error: (...args: any[]) => mockLoggerError(...args),
	},
}))

describe("UserKnowledgeReadLogService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getAllByTenant", () => {
		it("should return paginated read logs for tenant", async () => {
			const mockData = {
				entries: [
					{
						id: "log-1",
						userId: "user-123",
						knowledgeId: "know-123",
						status: "VIEWED",
					},
				],
				totalData: 1,
				totalPage: 1,
			}
			mockGetAllByTenant.mockResolvedValue(mockData)

			const result = await getAllByTenant("tenant-123", {} as any)

			expect(result.status).toBe(true)
			expect((result as any).data).toEqual(mockData)
			expect(mockGetAllByTenant).toHaveBeenCalledWith("tenant-123", {})
		})

		it("should handle errors and return failure", async () => {
			mockGetAllByTenant.mockRejectedValue(new Error("DB error"))

			const result = await getAllByTenant("tenant-123", {} as any)

			expect(result.status).toBe(false)
		})
	})

	describe("getStatusInTenant", () => {
		const tenantId = "tenant-123"
		const userId = "user-123"
		const knowledgeId = "know-123"

		it("should return read status when knowledge belongs to tenant", async () => {
			mockFindFirst.mockResolvedValue({ id: knowledgeId })
			mockGetByUserAndKnowledge.mockResolvedValue({
				id: "log-1",
				status: "VIEWED",
			})

			const result = await getStatusInTenant(tenantId, userId, knowledgeId)

			expect(result.status).toBe(true)
			expect(mockGetByUserAndKnowledge).toHaveBeenCalledWith(userId, knowledgeId)
		})

		it("should return failure when knowledge not found in tenant", async () => {
			mockFindFirst.mockResolvedValue(null)

			const result = await getStatusInTenant(tenantId, userId, knowledgeId)

			expect(result.status).toBe(false)
			expect((result as any).code).toBe(404)
		})

		it("should handle errors and return failure", async () => {
			mockFindFirst.mockRejectedValue(new Error("DB error"))

			const result = await getStatusInTenant(tenantId, userId, knowledgeId)

			expect(result.status).toBe(false)
		})
	})

	describe("markViewedInTenant", () => {
		const tenantId = "tenant-123"
		const userId = "user-123"
		const knowledgeId = "know-123"

		it("should mark knowledge as viewed when it belongs to tenant", async () => {
			mockFindFirst.mockResolvedValue({ id: knowledgeId })
			mockUpsertView.mockResolvedValue({
				id: "log-1",
				userId,
				knowledgeId,
				status: "VIEWED",
				viewCount: 1,
			})

			const result = await markViewedInTenant(tenantId, userId, knowledgeId)

			expect(result.status).toBe(true)
			expect(mockUpsertView).toHaveBeenCalledWith(userId, knowledgeId)
		})

		it("should return failure when knowledge not found in tenant", async () => {
			mockFindFirst.mockResolvedValue(null)

			const result = await markViewedInTenant(tenantId, userId, knowledgeId)

			expect(result.status).toBe(false)
			expect((result as any).code).toBe(404)
		})

		it("should handle errors and return failure", async () => {
			mockFindFirst.mockRejectedValue(new Error("DB error"))

			const result = await markViewedInTenant(tenantId, userId, knowledgeId)

			expect(result.status).toBe(false)
		})
	})
})

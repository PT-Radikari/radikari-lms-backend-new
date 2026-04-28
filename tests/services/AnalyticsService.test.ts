/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { getAnalytics } from "$services/Analytics/AnalyticsService"

jest.mock("$pkg/prisma", () => {
	const mockAiUsageLogFindMany = jest.fn<any>()
	const mockBroadcastCount = jest.fn<any>()
	const mockAiChatRoomMessageCount = jest.fn<any>()
	const mockTenantFindMany = jest.fn<any>()
	return {
		prisma: {
			aiUsageLog: {
				findMany: mockAiUsageLogFindMany,
			},
			tenant: {
				findMany: mockTenantFindMany,
			},
			broadcast: {
				count: mockBroadcastCount,
			},
			aiChatRoomMessage: {
				count: mockAiChatRoomMessageCount,
			},
		},
		__mocks: {
			mockAiUsageLogFindMany,
			mockBroadcastCount,
			mockAiChatRoomMessageCount,
			mockTenantFindMany,
		},
	}
})

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

const setupDefaultMocks = () => {
	const mocks = (jest.requireMock("$pkg/prisma") as any).__mocks
	mocks.mockAiUsageLogFindMany.mockResolvedValue([])
	mocks.mockTenantFindMany.mockResolvedValue([])
	mocks.mockBroadcastCount.mockResolvedValue(0)
	mocks.mockAiChatRoomMessageCount.mockResolvedValue(0)
}

describe("AnalyticsService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupDefaultMocks()
	})

	describe("getAnalytics", () => {
		it("should return analytics dashboard data structure", async () => {
			const mocks = (jest.requireMock("$pkg/prisma") as any).__mocks
			mocks.mockAiUsageLogFindMany.mockResolvedValue([
				{ createdAt: new Date(), totalTokens: 100, promptTokens: 80, completionTokens: 20, tenantId: "t1" },
			])
			mocks.mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 10000 },
			])
			mocks.mockBroadcastCount.mockResolvedValue(5)
			mocks.mockAiChatRoomMessageCount.mockResolvedValue(10)

			const result = await getAnalytics("tenant-123", "7d")

			expect(result).toHaveProperty("summary")
			expect(result).toHaveProperty("tokenConsumption")
			expect(result).toHaveProperty("tenantUsage")
			expect(result).toHaveProperty("tenantDistribution")
		})

		it("should return summary with expected fields", async () => {
			const mocks = (jest.requireMock("$pkg/prisma") as any).__mocks
			mocks.mockAiUsageLogFindMany.mockResolvedValue([
				{ createdAt: new Date(), totalTokens: 500, promptTokens: 300, completionTokens: 200, tenantId: "t1" },
			])
			mocks.mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 1000 },
			])
			mocks.mockBroadcastCount.mockResolvedValue(2)
			mocks.mockAiChatRoomMessageCount.mockResolvedValue(3)

			const result = await getAnalytics("tenant-123", "24h")

			expect(result.summary).toHaveProperty("automatedTasks")
			expect(result.summary).toHaveProperty("connectedIntegrations")
			expect(result.summary).toHaveProperty("generatedArtifacts")
			expect(result.summary).toHaveProperty("aiTokensUsed")
			expect(result.summary).toHaveProperty("totalCostIDR")
		})

		it("should support different time ranges", async () => {
			const ranges = ["24h", "7d", "30d", "all"] as const

			for (const range of ranges) {
				const result = await getAnalytics("tenant-123", range)
				expect(result).toHaveProperty("summary")
			}
		})
	})
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { getAnalytics } from "$services/Analytics/AnalyticsService"

const mockAiUsageLogFindMany = jest.fn<any>()
const mockBroadcastCount = jest.fn<any>()
const mockAiChatRoomMessageCount = jest.fn<any>()
const mockTenantFindMany = jest.fn<any>()

jest.mock("$pkg/prisma", () => ({
	prisma: {
		aiUsageLog: {
			findMany: (...args: any[]) => mockAiUsageLogFindMany(...args),
		},
		tenant: {
			findMany: (...args: any[]) => mockTenantFindMany(...args),
		},
		broadcast: {
			count: (...args: any[]) => mockBroadcastCount(...args),
		},
		aiChatRoomMessage: {
			count: (...args: any[]) => mockAiChatRoomMessageCount(...args),
		},
	},
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

const setupDefaultMocks = () => {
	mockAiUsageLogFindMany.mockResolvedValue([])
	mockTenantFindMany.mockResolvedValue([])
	mockBroadcastCount.mockResolvedValue(0)
	mockAiChatRoomMessageCount.mockResolvedValue(0)
}

describe("AnalyticsService", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		setupDefaultMocks()
	})

	describe("getAnalytics", () => {
		it("should return analytics dashboard data structure", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 100,
					promptTokens: 80,
					completionTokens: 20,
					tenantId: "t1",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 10000 },
			])
			mockBroadcastCount.mockResolvedValue(5)
			mockAiChatRoomMessageCount.mockResolvedValue(10)

			const result = await getAnalytics("tenant-123", "7d")

			expect(result).toHaveProperty("summary")
			expect(result).toHaveProperty("tokenConsumption")
			expect(result).toHaveProperty("tenantUsage")
			expect(result).toHaveProperty("tenantDistribution")
		})

		it("should return summary with expected fields", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 500,
					promptTokens: 300,
					completionTokens: 200,
					tenantId: "t1",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 1000 },
			])
			mockBroadcastCount.mockResolvedValue(2)
			mockAiChatRoomMessageCount.mockResolvedValue(3)

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

		it("should calculate totalCostIDR correctly", async () => {
			// GPT-4.1-mini pricing: Input $0.40/1M tokens, Output $1.60/1M tokens
			// 1 USD = 16,000 IDR
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 2_000_000, // 2M total
					promptTokens: 1_000_000, // 1M input
					completionTokens: 1_000_000, // 1M output
					tenantId: "t1",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 10000000 },
			])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			// Input cost: 1M/1M * $0.40 = $0.40
			// Output cost: 1M/1M * $1.60 = $1.60
			// Total USD: $2.00
			// Total IDR: $2.00 * 16000 = 32000
			expect(result.summary.totalCostIDR).toBe(32000)
			expect(result.summary.promptTokens).toBe(1_000_000)
			expect(result.summary.completionTokens).toBe(1_000_000)
			expect(result.summary.aiTokensUsed).toBe(2_000_000)
		})

		it("should handle zero tokens gracefully", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([])
			mockTenantFindMany.mockResolvedValue([])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			expect(result.summary.totalCostIDR).toBe(0)
			expect(result.summary.aiTokensUsed).toBe(0)
			expect(result.summary.promptTokens).toBe(0)
			expect(result.summary.completionTokens).toBe(0)
		})

		it("should handle division by zero on tokenLimit", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 500,
					promptTokens: 300,
					completionTokens: 200,
					tenantId: "t1",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 0 }, // Zero limit
			])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			// Should not be NaN or Infinity
			const tenantUsageItem = result.tenantUsage.find((t) => t.tenantId === "t1")
			expect(tenantUsageItem?.usagePercentage).toBe(0)
		})

		it("should generate HSL colors for tenant distribution", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 100,
					promptTokens: 50,
					completionTokens: 50,
					tenantId: "t1",
				},
				{
					createdAt: new Date(),
					totalTokens: 200,
					promptTokens: 100,
					completionTokens: 100,
					tenantId: "t2",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 1000 },
				{ id: "t2", name: "Tenant 2", tokenLimit: 2000 },
			])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			expect(result.tenantDistribution).toHaveLength(2)
			result.tenantDistribution.forEach((item) => {
				expect(item.fill).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
			})
			// Each tenant should have a different fill color
			expect(result.tenantDistribution[0].fill).not.toBe(
				result.tenantDistribution[1].fill,
			)
		})

		it("should use Unknown Tenant for missing tenant names", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 100,
					promptTokens: 50,
					completionTokens: 50,
					tenantId: "unknown-tenant-id",
				},
			])
			mockTenantFindMany.mockResolvedValue([]) // No tenant found
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			const tenantUsageItem = result.tenantUsage.find(
				(t) => t.tenantId === "unknown-tenant-id",
			)
			expect(tenantUsageItem?.name).toBe("Unknown Tenant")
		})

		it("should aggregate token consumption by date format for 24h", async () => {
			const now = new Date()
			const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
			const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: oneHourAgo,
					totalTokens: 100,
					promptTokens: 60,
					completionTokens: 40,
					tenantId: "t1",
				},
				{
					createdAt: twoHoursAgo,
					totalTokens: 50,
					promptTokens: 30,
					completionTokens: 20,
					tenantId: "t1",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 1000 },
			])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			// For 24h, date format is "HH:mm"
			expect(result.tokenConsumption.length).toBeGreaterThan(0)
			result.tokenConsumption.forEach((item) => {
				// HH:mm format has 5 characters
				expect(item.date).toMatch(/^\d{2}:\d{2}$/)
			})
		})

		it("should sort tenant usage by totalTokens descending", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 100,
					promptTokens: 50,
					completionTokens: 50,
					tenantId: "t1",
				},
				{
					createdAt: new Date(),
					totalTokens: 500,
					promptTokens: 250,
					completionTokens: 250,
					tenantId: "t2",
				},
				{
					createdAt: new Date(),
					totalTokens: 300,
					promptTokens: 150,
					completionTokens: 150,
					tenantId: "t3",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "t1", name: "Tenant 1", tokenLimit: 1000 },
				{ id: "t2", name: "Tenant 2", tokenLimit: 5000 },
				{ id: "t3", name: "Tenant 3", tokenLimit: 3000 },
			])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			expect(result.tenantUsage[0].tenantId).toBe("t2") // 500 tokens
			expect(result.tenantUsage[1].tenantId).toBe("t3") // 300 tokens
			expect(result.tenantUsage[2].tenantId).toBe("t1") // 100 tokens
		})

		it("should return highest usage tenant in summary", async () => {
			mockAiUsageLogFindMany.mockResolvedValue([
				{
					createdAt: new Date(),
					totalTokens: 1000,
					promptTokens: 500,
					completionTokens: 500,
					tenantId: "top-tenant",
				},
				{
					createdAt: new Date(),
					totalTokens: 200,
					promptTokens: 100,
					completionTokens: 100,
					tenantId: "low-tenant",
				},
			])
			mockTenantFindMany.mockResolvedValue([
				{ id: "top-tenant", name: "Top Tenant", tokenLimit: 10000 },
				{ id: "low-tenant", name: "Low Tenant", tokenLimit: 5000 },
			])
			mockBroadcastCount.mockResolvedValue(0)
			mockAiChatRoomMessageCount.mockResolvedValue(0)

			const result = await getAnalytics("tenant-123", "24h")

			expect(result.summary.highestUsageTenant?.name).toBe("Top Tenant")
			expect(result.summary.highestUsageTenant?.tokens).toBe(1000)
		})
	})
})

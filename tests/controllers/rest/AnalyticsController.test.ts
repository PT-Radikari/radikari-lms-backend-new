/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

const mockGetAnalytics = jest.fn<any>() // eslint-disable-line @typescript-eslint/no-explicit-any

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
	debug: jest.fn<any>(),
}))

jest.mock("$services/Analytics/AnalyticsService", () => ({
	getAnalytics: (...args: any[]) => mockGetAnalytics(...args),
}))

import * as AnalyticsController from "$controllers/rest/AnalyticsController"

describe("AnalyticsController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("getAnalytics", () => {
		it("should return 200 with analytics data on success", async () => {
			const mockData = {
				summary: {
					automatedTasks: 10,
					connectedIntegrations: 3,
					generatedArtifacts: 42,
					aiTokensUsed: 50000,
					promptTokens: 30000,
					completionTokens: 20000,
					totalCostIDR: 2000000,
					highestUsageTenant: { name: "Tenant A", tokens: 30000 },
				},
				tokenConsumption: [{ date: "Mon", tokens: 5000, promptTokens: 3000, completionTokens: 2000 }],
				tenantUsage: [{ tenantId: "tenant-1", name: "Tenant A", totalTokens: 30000, tokenLimit: 100000, usagePercentage: 30 }],
				tenantDistribution: [{ name: "Tenant A", value: 30000, fill: "hsl(215, 80%, 50%)" }],
			}
			mockGetAnalytics.mockResolvedValue(mockData)

			const { mock, spy } = createMockContext({
				query: { range: "7d" },
				headers: { "x-tenant-id": "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AnalyticsController.getAnalytics(mock)

			expect(mockGetAnalytics).toHaveBeenCalledWith("tenant-test-123", "7d")
			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				content: mockData,
				message: "Successfully retrieved analytics data",
			})
		})

		it("should use x-tenant-id header for tenantId", async () => {
			mockGetAnalytics.mockResolvedValue({
				summary: {},
				tokenConsumption: [],
				tenantUsage: [],
				tenantDistribution: [],
			})

			const { mock, spy } = createMockContext({
				query: { range: "24h" },
				headers: { "x-tenant-id": "custom-tenant-456" },
				jwtPayload: mockUserJWT,
			})

			await AnalyticsController.getAnalytics(mock)

			expect(mockGetAnalytics).toHaveBeenCalledWith("custom-tenant-456", "24h")
			expect(spy.status).toHaveBeenCalledWith(200)
		})

		it("should fall back to jwtPayload tenantId when x-tenant-id header is missing", async () => {
			mockGetAnalytics.mockResolvedValue({
				summary: {},
				tokenConsumption: [],
				tenantUsage: [],
				tenantDistribution: [],
			})

			const userWithTenant = {
				...mockUserJWT,
				tenantUser: [{ tenantId: "tenant-test-123" }],
			}
			const { mock, spy } = createMockContext({
				query: { range: "30d" },
				headers: {},
				user: userWithTenant,
				jwtPayload: mockUserJWT,
			})

			await AnalyticsController.getAnalytics(mock)

			expect(mockGetAnalytics).toHaveBeenCalledWith("tenant-test-123", "30d")
			expect(spy.status).toHaveBeenCalledWith(200)
		})

		it("should use default range of 24h when range is not provided", async () => {
			mockGetAnalytics.mockResolvedValue({
				summary: {},
				tokenConsumption: [],
				tenantUsage: [],
				tenantDistribution: [],
			})

			const { mock, spy } = createMockContext({
				query: {},
				headers: { "x-tenant-id": "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await AnalyticsController.getAnalytics(mock)

			expect(mockGetAnalytics).toHaveBeenCalledWith("tenant-test-123", "24h")
			expect(spy.status).toHaveBeenCalledWith(200)
		})

		it("should throw and propagate error when service throws", async () => {
			mockGetAnalytics.mockRejectedValue(new Error("Database error"))

			const { mock } = createMockContext({
				query: { range: "7d" },
				headers: { "x-tenant-id": "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await expect(AnalyticsController.getAnalytics(mock)).rejects.toThrow(
				"Database error",
			)
		})
	})
})

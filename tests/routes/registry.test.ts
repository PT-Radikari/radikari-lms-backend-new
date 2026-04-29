/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import RoutesRegistry from "$routes/registry"

describe("routes/registry", () => {
	it("should export all route modules", () => {
		expect(RoutesRegistry.UserRoutes).toBeDefined()
		expect(RoutesRegistry.TenantRoutes).toBeDefined()
		expect(RoutesRegistry.KnowledgeRoutes).toBeDefined()
		expect(RoutesRegistry.AssignmentRoutes).toBeDefined()
		expect(RoutesRegistry.AnnouncementRoutes).toBeDefined()
		expect(RoutesRegistry.ForumRoutes).toBeDefined()
		expect(RoutesRegistry.NotificationRoutes).toBeDefined()
		expect(RoutesRegistry.BroadcastRoutes).toBeDefined()
		expect(RoutesRegistry.AiPromptRoutes).toBeDefined()
		expect(RoutesRegistry.AccessControlListRoutes).toBeDefined()
		expect(RoutesRegistry.UserActivityLogRoutes).toBeDefined()
		expect(RoutesRegistry.AnalyticsRoutes).toBeDefined()
		expect(RoutesRegistry.ChatRoutes).toBeDefined()
		expect(RoutesRegistry.MasterKnowledgeCategoryRoutes).toBeDefined()
		expect(RoutesRegistry.MasterKnowledgeSubCategoryRoutes).toBeDefined()
		expect(RoutesRegistry.MasterKnowledgeCaseRoutes).toBeDefined()
		expect(RoutesRegistry.TenantUserManagementRoutes).toBeDefined()
		expect(RoutesRegistry.EphemeralRoutes).toBeDefined()
		expect(RoutesRegistry.StorageRoutes).toBeDefined()
		expect(RoutesRegistry.BulkKnowledgeRoutes).toBeDefined()
	})

	it("should have all 20 route modules", () => {
		const keys = Object.keys(RoutesRegistry)
		expect(keys.length).toBeGreaterThanOrEqual(20)
	})
})

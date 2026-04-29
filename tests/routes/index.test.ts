/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import router from "$routes/index"

describe("routes/index", () => {
	it("should export a Hono router", () => {
		expect(router).toBeDefined()
		expect(typeof router.route).toBe("function")
		expect(typeof router.get).toBe("function")
		expect(typeof router.post).toBe("function")
		expect(typeof router.put).toBe("function")
		expect(typeof router.delete).toBe("function")
		expect(typeof router.patch).toBe("function")
	})

	it("should have registered routes", () => {
		// Access the internal routes map - Hono exposes routes via .routes
		const routes = (router as any).routes
		expect(Array.isArray(routes)).toBe(true)
		expect(routes.length).toBeGreaterThan(0)
	})

	it("should have auth routes registered", () => {
		const routes = (router as any).routes
		const paths = routes.map((r: any) => r.path)
		expect(paths).toContain("/login")
		expect(paths).toContain("/verify-token")
	})

	it("should have tenant-scoped routes registered", () => {
		const routes = (router as any).routes
		const paths = routes.map((r: any) => r.path)
		const hasTenantRoutes = paths.some((p: string) => p.includes("tenants"))
		expect(hasTenantRoutes).toBe(true)
	})
})

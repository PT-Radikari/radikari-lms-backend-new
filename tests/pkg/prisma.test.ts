/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"

describe("pkg/prisma", () => {
	it("should export prisma singleton", async () => {
		const { prisma } = await import("$pkg/prisma")
		expect(prisma).toBeDefined()
	})

	it("should have Prisma client methods available", async () => {
		const { prisma } = await import("$pkg/prisma")
		// Prisma client should have standard query methods
		expect(typeof prisma.user).toBe("object")
		expect(typeof prisma.tenant).toBe("object")
	})

	it("should have aiUsageLog queryable", async () => {
		const { prisma } = await import("$pkg/prisma")
		expect(typeof prisma.aiUsageLog).toBe("object")
		expect(typeof prisma.aiUsageLog.findMany).toBe("function")
		expect(typeof prisma.aiUsageLog.create).toBe("function")
	})

	it("should have broadcast queryable", async () => {
		const { prisma } = await import("$pkg/prisma")
		expect(typeof prisma.broadcast).toBe("object")
		expect(typeof prisma.broadcast.count).toBe("function")
	})

	it("should have aiChatRoomMessage queryable", async () => {
		const { prisma } = await import("$pkg/prisma")
		expect(typeof prisma.aiChatRoomMessage).toBe("object")
		expect(typeof prisma.aiChatRoomMessage.count).toBe("function")
	})

	it("should have tenant queryable", async () => {
		const { prisma } = await import("$pkg/prisma")
		expect(typeof prisma.tenant).toBe("object")
		expect(typeof prisma.tenant.findMany).toBe("function")
	})
})

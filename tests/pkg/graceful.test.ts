/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest } from "@jest/globals"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
}))

describe("pkg/graceful", () => {
	it("should export registerProcessForShutdown function", async () => {
		const { registerProcessForShutdown } = await import("$pkg/graceful")
		expect(typeof registerProcessForShutdown).toBe("function")
	})

	it("should export shutdownProcesses function", async () => {
		const { shutdownProcesses } = await import("$pkg/graceful")
		expect(typeof shutdownProcesses).toBe("function")
	})

	describe("registerProcessForShutdown", () => {
		it("should accept a name and shutdown function", async () => {
			const { registerProcessForShutdown, shutdownProcesses } = await import(
				"$pkg/graceful"
			)
			const mockShutdown = jest.fn<any>().mockResolvedValue(undefined)

			registerProcessForShutdown("test-service", mockShutdown)
			await shutdownProcesses()

			expect(mockShutdown).toHaveBeenCalled()
		})

		it("should execute shutdown functions in order", async () => {
			const { registerProcessForShutdown, shutdownProcesses } = await import(
				"$pkg/graceful"
			)
			const order: string[] = []
			const mock1 = jest.fn<any>().mockImplementation(() => {
				order.push("first")
				return Promise.resolve()
			})
			const mock2 = jest.fn<any>().mockImplementation(() => {
				order.push("second")
				return Promise.resolve()
			})

			registerProcessForShutdown("service-1", mock1)
			registerProcessForShutdown("service-2", mock2)
			await shutdownProcesses()

			expect(order).toEqual(["first", "second"])
		})
	})
})

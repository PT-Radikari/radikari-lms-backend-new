/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { EphemeralThreadJanitor } from "$services/Ephemeral/EphemeralThreadJanitor"

jest.mock("$pkg/logger", () => ({
	info: () => {},
	error: () => {},
	warn: () => {},
	debug: () => {},
}))

jest.mock("$services/Ephemeral/EphemeralThreadStore", () => ({
	EphemeralThreadStore: {
		getInstance: () => ({
			deleteExpiredThreads: () => {},
		}),
	},
}))

describe("EphemeralThreadJanitor", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("should get status with interval info", () => {
		const janitor = EphemeralThreadJanitor.getInstance()
		const status = janitor.getStatus()

		expect(status).toHaveProperty("isRunning")
		expect(status).toHaveProperty("intervalMs")
		expect(typeof status.intervalMs).toBe("number")
	})

	it("should stop running janitor", () => {
		const janitor = EphemeralThreadJanitor.getInstance()
		janitor.stop()

		const status = janitor.getStatus()
		expect(status.isRunning).toBe(false)
	})

	it("should return isRunning false when stopped", () => {
		const janitor = EphemeralThreadJanitor.getInstance()
		janitor.stop()

		expect(janitor.getStatus().isRunning).toBe(false)
	})
})

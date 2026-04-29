/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockGetAssignmentsByExpiredDate = jest.fn<any>()
jest.mock("$services/AssignmentAttemptService", () => ({
	getAssignmentsByExpiredDate: mockGetAssignmentsByExpiredDate,
}))

const mockLoggerInfo = jest.fn<any>()
const mockLoggerError = jest.fn<any>()
const mockLoggerWarning = jest.fn<any>()
jest.mock("$pkg/logger", () => ({
	info: mockLoggerInfo,
	error: mockLoggerError,
	warning: mockLoggerWarning,
}))

import { checkAssignmentExpiredDate } from "$controllers/cron/AssignmentAttemptController"

describe("AssignmentAttemptController (Cron)", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("checkAssignmentExpiredDate", () => {
		it("should call AssignmentAttemptService.getAssignmentsByExpiredDate", async () => {
			mockGetAssignmentsByExpiredDate.mockResolvedValue(undefined)

			await checkAssignmentExpiredDate()

			expect(mockGetAssignmentsByExpiredDate).toHaveBeenCalledTimes(1)
		})

		it("should log error when service throws", async () => {
			const error = new Error("Database connection timeout")
			mockGetAssignmentsByExpiredDate.mockRejectedValue(error)

			await checkAssignmentExpiredDate()

			expect(mockLoggerError).toHaveBeenCalledTimes(1)
			expect(mockLoggerError).toHaveBeenCalledWith(
				`AssignmentAttemptController.checkAssignmentExpiredDate`,
				expect.objectContaining({ error }),
			)
		})

		it("should not throw even when service throws (error is caught)", async () => {
			mockGetAssignmentsByExpiredDate.mockRejectedValue(
				new Error("Some error"),
			)

			await expect(checkAssignmentExpiredDate()).resolves.not.toThrow()
			expect(mockLoggerError).toHaveBeenCalledTimes(1)
		})
	})
})

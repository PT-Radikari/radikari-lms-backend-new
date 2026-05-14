/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

jest.mock("$services/KnowledgeService", () => ({
	sendKnowledgeApprovalNotification: jest.fn<any>(),
}))

jest.mock("$services/AssignmentService", () => ({
	sendAssignmentAssignedNotification: jest.fn<any>(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

import {
	sendKnowledgeApprovalNotification,
	sendAssignmentAssignedNotification,
} from "$controllers/consumer/NotificationController"

describe("NotificationController (Consumer)", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("sendKnowledgeApprovalNotification", () => {
		it("should call KnowledgeService with parsed message params", async () => {
			const mocks = jest.requireMock("$services/KnowledgeService") as any
			const knowledgeId = "knowledge-123"
			const excludeUserId = "user-456"
			const message = JSON.stringify({ knowledgeId, excludeUserId })

			mocks.sendKnowledgeApprovalNotification.mockResolvedValue(undefined)

			await sendKnowledgeApprovalNotification(message)

			expect(mocks.sendKnowledgeApprovalNotification).toHaveBeenCalledWith(
				knowledgeId,
				excludeUserId,
			)
		})

		it("should call KnowledgeService even with missing fields", async () => {
			const mocks = jest.requireMock("$services/KnowledgeService") as any
			mocks.sendKnowledgeApprovalNotification.mockResolvedValue(undefined)

			await sendKnowledgeApprovalNotification(JSON.stringify({}))

			expect(mocks.sendKnowledgeApprovalNotification).toHaveBeenCalledWith(
				undefined,
				undefined,
			)
		})

		it("should catch error when JSON parsing fails", async () => {
			const mocks = jest.requireMock("$services/KnowledgeService") as any
			const logger = jest.requireMock("$pkg/logger") as any

			await sendKnowledgeApprovalNotification("invalid json")

			expect(mocks.sendKnowledgeApprovalNotification).not.toHaveBeenCalled()
			expect(logger.error).toHaveBeenCalled()
		})

		it("should catch error when service throws", async () => {
			const mocks = jest.requireMock("$services/KnowledgeService") as any
			const logger = jest.requireMock("$pkg/logger") as any

			mocks.sendKnowledgeApprovalNotification.mockRejectedValue(
				new Error("Database error"),
			)

			await sendKnowledgeApprovalNotification(
				JSON.stringify({ knowledgeId: "k-1", excludeUserId: "u-1" }),
			)

			expect(logger.error).toHaveBeenCalled()
		})
	})

	describe("sendAssignmentAssignedNotification", () => {
		it("should call AssignmentService with parsed message params", async () => {
			const mocks = jest.requireMock("$services/AssignmentService") as any
			const assignmentId = "assignment-123"
			const tenantId = "tenant-456"
			const message = JSON.stringify({ assignmentId, tenantId })

			mocks.sendAssignmentAssignedNotification.mockResolvedValue(undefined)

			await sendAssignmentAssignedNotification(message)

			expect(mocks.sendAssignmentAssignedNotification).toHaveBeenCalledWith(
				assignmentId,
				tenantId,
			)
		})

		it("should call AssignmentService even with missing fields", async () => {
			const mocks = jest.requireMock("$services/AssignmentService") as any
			mocks.sendAssignmentAssignedNotification.mockResolvedValue(undefined)

			await sendAssignmentAssignedNotification(JSON.stringify({}))

			expect(mocks.sendAssignmentAssignedNotification).toHaveBeenCalledWith(
				undefined,
				undefined,
			)
		})

		it("should catch error when JSON parsing fails", async () => {
			const mocks = jest.requireMock("$services/AssignmentService") as any
			const logger = jest.requireMock("$pkg/logger") as any

			await sendAssignmentAssignedNotification("invalid json")

			expect(mocks.sendAssignmentAssignedNotification).not.toHaveBeenCalled()
			expect(logger.error).toHaveBeenCalled()
		})

		it("should catch error when service throws", async () => {
			const mocks = jest.requireMock("$services/AssignmentService") as any
			const logger = jest.requireMock("$pkg/logger") as any

			mocks.sendAssignmentAssignedNotification.mockRejectedValue(
				new Error("Service unavailable"),
			)

			await sendAssignmentAssignedNotification(
				JSON.stringify({ assignmentId: "a-1", tenantId: "t-1" }),
			)

			expect(logger.error).toHaveBeenCalled()
		})
	})
})

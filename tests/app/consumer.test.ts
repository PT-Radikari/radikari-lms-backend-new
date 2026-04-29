/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockConnect = jest.fn<any>()
const mockConsume = jest.fn<any>()
const mockSendToQueue = jest.fn<any>()
const mockDisconnect = jest.fn<any>()
const mockGetChannel = jest.fn<any>()
const mockSetPrefetchCount = jest.fn<any>()

jest.mock("$pkg/pubsub", () => ({
	RabbitMQConnection: jest.fn<any>().mockImplementation(() => ({
		connect: mockConnect,
		consume: mockConsume,
		sendToQueue: mockSendToQueue,
		disconnect: mockDisconnect,
		getChannel: mockGetChannel,
		setPrefetchCount: mockSetPrefetchCount,
	})),
}))

jest.mock("$entities/PubSub", () => ({
	PUBSUB_TOPICS: {
		ASSIGNMENT_ATTEMPT_SUBMIT: "ASSIGNMENT_ATTEMPT_SUBMIT",
		ASSIGNMENT_REGRADE_ATTEMPT: "ASSIGNMENT_REGRADE_ATTEMPT",
		KNOWLEDGE_APPROVAL_NOTIFICATION: "KNOWLEDGE_APPROVAL_NOTIFICATION",
		ASSIGNMENT_ASSIGNED_NOTIFICATION: "ASSIGNMENT_ASSIGNED_NOTIFICATION",
	},
}))

jest.mock("$controllers/consumer/AssignmentAttemptController", () => ({
	calculateAssignmentScore: jest.fn<any>(),
}))

jest.mock("$controllers/consumer/NotificationController", () => ({
	sendKnowledgeApprovalNotification: jest.fn<any>(),
	sendAssignmentAssignedNotification: jest.fn<any>(),
}))

import { startConsumerApp } from "$app/consumer"
import { PUBSUB_TOPICS } from "$entities/PubSub"

describe("app/consumer", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it("should create two RabbitMQ connections", async () => {
		mockConnect.mockResolvedValue(undefined)
		mockConsume.mockResolvedValue(undefined)

		await startConsumerApp()

		expect(mockConnect).toHaveBeenCalledTimes(2)
	})

	it("should register 4 consumers (2 on common, 2 on notification)", async () => {
		mockConnect.mockResolvedValue(undefined)
		mockConsume.mockResolvedValue(undefined)

		await startConsumerApp()

		expect(mockConsume).toHaveBeenCalledTimes(4)
		expect(mockConsume).toHaveBeenCalledWith(
			PUBSUB_TOPICS.ASSIGNMENT_ATTEMPT_SUBMIT,
			expect.any(Function),
		)
		expect(mockConsume).toHaveBeenCalledWith(
			PUBSUB_TOPICS.ASSIGNMENT_REGRADE_ATTEMPT,
			expect.any(Function),
		)
		expect(mockConsume).toHaveBeenCalledWith(
			PUBSUB_TOPICS.KNOWLEDGE_APPROVAL_NOTIFICATION,
			expect.any(Function),
		)
		expect(mockConsume).toHaveBeenCalledWith(
			PUBSUB_TOPICS.ASSIGNMENT_ASSIGNED_NOTIFICATION,
			expect.any(Function),
		)
	})
})

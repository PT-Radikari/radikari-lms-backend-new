/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

const mockConnect = jest.fn<any>()
const mockClose = jest.fn<any>()
const mockSendToQueue = jest.fn<any>()
const mockAssertQueue = jest.fn<any>()
const mockConsume = jest.fn<any>()
const mockAck = jest.fn<any>()
const mockDeleteQueue = jest.fn<any>()
const mockPrefetch = jest.fn<any>()

const mockChannel: any = {
	sendToQueue: mockSendToQueue,
	assertQueue: mockAssertQueue,
	consume: mockConsume,
	ack: mockAck,
	deleteQueue: mockDeleteQueue,
	prefetch: mockPrefetch,
	close: mockClose,
}

const mockConnection: any = {
	createChannel: jest.fn<any>().mockResolvedValue(mockChannel),
	close: mockClose,
}

jest.mock("amqplib", () => ({
	connect: jest.fn<any>().mockResolvedValue(mockConnection),
}))

jest.mock("$pkg/graceful", () => ({
	registerProcessForShutdown: jest.fn<any>(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

import { RabbitMQConnection, GlobalPubSub } from "$pkg/pubsub"

describe("pkg/pubsub", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockConnect.mockResolvedValue(mockConnection)
	})

	describe("RabbitMQConnection", () => {
		it("should create a connection on connect", async () => {
			const conn = new RabbitMQConnection()
			await conn.connect()

			const amqplib = jest.requireMock("amqplib") as any
			expect(amqplib.connect).toHaveBeenCalled()
		})

		it("should send message to queue", async () => {
			const conn = new RabbitMQConnection()
			await conn.connect()

			mockSendToQueue.mockReturnValue(true)
			await conn.sendToQueue("test-queue", { id: "123" })

			expect(mockSendToQueue).toHaveBeenCalled()
		})

		it("should disconnect", async () => {
			const conn = new RabbitMQConnection()
			await conn.connect()

			await conn.disconnect()

			expect(mockClose).toHaveBeenCalled()
		})

		it("should set prefetch count", async () => {
			const conn = new RabbitMQConnection()
			await conn.connect()

			await conn.setPrefetchCount(10)

			expect(mockPrefetch).toHaveBeenCalledWith(10)
		})
	})

	describe("GlobalPubSub", () => {
		it("should return singleton instance", () => {
			const instance = GlobalPubSub.getInstance()
			expect(instance).toBeDefined()
		})

		it("should return same instance on multiple calls", () => {
			const instance1 = GlobalPubSub.getInstance()
			const instance2 = GlobalPubSub.getInstance()
			expect(instance1).toBe(instance2)
		})
	})
})

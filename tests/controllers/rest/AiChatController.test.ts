/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockCreateChatRoom = jest.fn<any>()
let mockGetAllChatRooms = jest.fn<any>()
let mockGetChatRoomById = jest.fn<any>()
let mockUpdateChatRoom = jest.fn<any>()
let mockDeleteChatRoomById = jest.fn<any>()
let mockGetChatRoomHistory = jest.fn<any>()
let mockChat = jest.fn<any>()
let mockArchiveOrUnarchiveAiChatRoom = jest.fn<any>()

jest.mock("$services/AiChat", () => ({
	Chat: {
		createChatRoom: (...args: any[]) => mockCreateChatRoom(...args),
		getAllChatRooms: (...args: any[]) => mockGetAllChatRooms(...args),
		getChatRoomById: (...args: any[]) => mockGetChatRoomById(...args),
		updateChatRoom: (...args: any[]) => mockUpdateChatRoom(...args),
		deleteChatRoomById: (...args: any[]) => mockDeleteChatRoomById(...args),
		getChatRoomHistory: (...args: any[]) => mockGetChatRoomHistory(...args),
		chat: (...args: any[]) => mockChat(...args),
		archiveOrUnarchiveAiChatRoom: (...args: any[]) => mockArchiveOrUnarchiveAiChatRoom(...args),
	},
}))

let mockStreamHybridChat = jest.fn<any>()

jest.mock("$services/AiChat/HybridChatService", () => ({
	streamHybridChat: (...args: any[]) => mockStreamHybridChat(...args),
}))

import * as AiChatController from "$controllers/rest/AiChatController"

describe("AiChatController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── createChatRoom ───────────────────────────────────────────────────

	describe("createChatRoom", () => {
		it("should return 201 with created chat room on success", async () => {
			const mockRoom = { id: "room-123", name: "Test Room" }
			mockCreateChatRoom.mockResolvedValue({ status: true, data: mockRoom })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { name: "Test Room" },
			})

			await AiChatController.createChatRoom(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully created new AiChatRoom!",
			})
		})

		it("should return error status from service on failure", async () => {
			mockCreateChatRoom.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Validation error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { name: "Test Room" },
			})

			await AiChatController.createChatRoom(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getAllChatRooms ──────────────────────────────────────────────────

	describe("getAllChatRooms", () => {
		it("should return 200 with chat rooms on success", async () => {
			mockGetAllChatRooms.mockResolvedValue({
				status: true,
				data: { data: [], total: 0 },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await AiChatController.getAllChatRooms(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all AiChatRoom!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAllChatRooms.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await AiChatController.getAllChatRooms(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getChatRoomById ─────────────────────────────────────────────────

	describe("getChatRoomById", () => {
		it("should return 200 with chat room on success", async () => {
			const mockRoom = { id: "room-123", name: "Test Room" }
			mockGetChatRoomById.mockResolvedValue({ status: true, data: mockRoom })

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
			})

			await AiChatController.getChatRoomById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched AiChatRoom by id!",
			})
		})

		it("should return 404 when chat room not found", async () => {
			mockGetChatRoomById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Chat room not found" },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "nonexistent" },
				jwtPayload: mockUserJWT,
			})

			await AiChatController.getChatRoomById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── updateChatRoom ───────────────────────────────────────────────────

	describe("updateChatRoom", () => {
		it("should return 200 with updated chat room on success", async () => {
			const mockRoom = { id: "room-123", name: "Updated Room" }
			mockUpdateChatRoom.mockResolvedValue({ status: true, data: mockRoom })

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { name: "Updated Room" },
			})

			await AiChatController.updateChatRoom(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated AiChatRoom!",
			})
		})

		it("should return error status when service fails", async () => {
			mockUpdateChatRoom.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Update failed" },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { name: "Updated" },
			})

			await AiChatController.updateChatRoom(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── deleteChatRoomById ───────────────────────────────────────────────

	describe("deleteChatRoomById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteChatRoomById.mockResolvedValue({ status: true, data: {} })

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
			})

			await AiChatController.deleteChatRoomById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully deleted AiChatRoom!",
			})
		})

		it("should return 404 when chat room not found", async () => {
			mockDeleteChatRoomById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Chat room not found" },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "nonexistent" },
				jwtPayload: mockUserJWT,
			})

			await AiChatController.deleteChatRoomById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── getChatRoomHistory ───────────────────────────────────────────────

	describe("getChatRoomHistory", () => {
		it("should return 200 with chat history on success", async () => {
			mockGetChatRoomHistory.mockResolvedValue({
				status: true,
				data: { data: [], total: 0 },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await AiChatController.getChatRoomHistory(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched AiChatRoom history!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetChatRoomHistory.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await AiChatController.getChatRoomHistory(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── chat ────────────────────────────────────────────────────────────

	describe("chat", () => {
		it("should return 200 with chat response on success", async () => {
			const mockResponse = { reply: "Hello!" }
			mockChat.mockResolvedValue({ status: true, data: mockResponse })

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { question: "Hello" },
			})

			await AiChatController.chat(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully sent message to AiChatRoom!",
			})
		})

		it("should return error status when service fails", async () => {
			mockChat.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Chat failed" },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { question: "Hello" },
			})

			await AiChatController.chat(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── archiveOrUnarchiveAiChatRoom ───────────────────────────────────

	describe("archiveOrUnarchiveAiChatRoom", () => {
		it("should return 200 on successful archive/unarchive", async () => {
			const mockRoom = { id: "room-123", isArchived: true }
			mockArchiveOrUnarchiveAiChatRoom.mockResolvedValue({ status: true, data: mockRoom })

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
			})

			await AiChatController.archiveOrUnarchiveAiChatRoom(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully archived or unarchived AiChatRoom!",
			})
		})

		it("should return error status when service fails", async () => {
			mockArchiveOrUnarchiveAiChatRoom.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Not authorized" },
			})

			const { mock, spy } = createMockContext({
				params: { chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
			})

			await AiChatController.archiveOrUnarchiveAiChatRoom(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── streamMessage ─────────────────────────────────────────────────────

	describe("streamMessage", () => {
		it("should stream message successfully with messages array", async () => {
			const mockResponse = new Response("stream-data", {
				headers: { "Content-Type": "text/event-stream" },
			})
			mockStreamHybridChat.mockResolvedValue(mockResponse)

			const { mock } = createMockContext({
				params: { tenantId: "tenant-123", chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: {
					messages: [{ role: "user", content: "Hello AI" }],
				},
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBe(mockResponse)
			expect(mockStreamHybridChat).toHaveBeenCalledWith({
				messages: [{ role: "user", content: "Hello AI" }],
				chatRoomId: "room-123",
				tenantId: "tenant-123",
				userId: mockUserJWT.id,
			})
		})

		it("should convert single message format to array", async () => {
			const mockResponse = new Response("stream-data")
			mockStreamHybridChat.mockResolvedValue(mockResponse)

			const { mock } = createMockContext({
				params: { tenantId: "tenant-123", chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { message: "Single message" },
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBe(mockResponse)
			expect(mockStreamHybridChat).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: expect.arrayContaining([
						expect.objectContaining({ role: "user", content: "Single message" }),
					]),
				}),
			)
		})

		it("should return 400 when request body is invalid", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-123", chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { messages: "not-an-array" },
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBeDefined()
			expect(spy.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: "Invalid request body" }),
				400,
			)
		})

		it("should return 400 when messages array is empty", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-123", chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: { messages: [] },
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBeDefined()
			expect(spy.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: "Messages are required" }),
				400,
			)
		})

		it("should return 400 when messages are missing and no single message", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-123", chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: {},
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBeDefined()
			expect(spy.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: "Messages are required" }),
				400,
			)
		})

		it("should return 400 when chatRoomId is missing", async () => {
			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-123" },
				jwtPayload: mockUserJWT,
				body: { messages: [{ role: "user", content: "Hello" }] },
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBeDefined()
			expect(spy.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: "Chat Room ID is required" }),
				400,
			)
		})

		it("should handle parts format in messages", async () => {
			const mockResponse = new Response("stream-data")
			mockStreamHybridChat.mockResolvedValue(mockResponse)

			const { mock } = createMockContext({
				params: { tenantId: "tenant-123", chatRoomId: "room-123" },
				jwtPayload: mockUserJWT,
				body: {
					messages: [
						{
							role: "user",
							parts: [
								{ type: "text", text: "Part one" },
								{ type: "text", text: "Part two" },
							],
						},
					],
				},
			})

			const result = await AiChatController.streamMessage(mock)

			expect(result).toBe(mockResponse)
			expect(mockStreamHybridChat).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: [{ role: "user", content: "Part onePart two" }],
				}),
			)
		})
	})
})

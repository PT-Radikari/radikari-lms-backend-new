/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockGetByUserId = jest.fn<any>()
let mockGetUnreadCount = jest.fn<any>()
let mockMarkAsRead = jest.fn<any>()
let mockMarkAllAsRead = jest.fn<any>()
let mockDeleteById = jest.fn<any>()

jest.mock("$services/NotificationService", () => ({
	getByUserId: (...args: any[]) => mockGetByUserId(...args),
	getUnreadCount: (...args: any[]) => mockGetUnreadCount(...args),
	markAsRead: (...args: any[]) => mockMarkAsRead(...args),
	markAllAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
}))

import * as NotificationController from "$controllers/rest/NotificationController"

describe("NotificationController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── getAll ────────────────────────────────────────────────────────────────

	describe("getAll", () => {
		it("should return 200 with paginated notifications on success", async () => {
			const mockNotifications = {
				data: [{ id: "notif-1", message: "Test" }],
				total: 1,
			}
			mockGetByUserId.mockResolvedValue({ status: true, data: mockNotifications })

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
				query: {},
			})

			await NotificationController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all Notifications!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetByUserId.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
				query: {},
			})

			await NotificationController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getUnreadCount ────────────────────────────────────────────────────────

	describe("getUnreadCount", () => {
		it("should return 200 with unread count on success", async () => {
			mockGetUnreadCount.mockResolvedValue({ status: true, data: { count: 5 } })

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await NotificationController.getUnreadCount(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched unread count!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetUnreadCount.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await NotificationController.getUnreadCount(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── markAsRead ──────────────────────────────────────────────────────────

	describe("markAsRead", () => {
		it("should return 200 on successful mark as read", async () => {
			mockMarkAsRead.mockResolvedValue({ status: true, data: { id: "notif-1" } })

			const { mock, spy } = createMockContext({
				params: { id: "notif-1" },
				jwtPayload: mockUserJWT,
			})

			await NotificationController.markAsRead(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully marked notification as read!",
			})
		})

		it("should return error status when service fails", async () => {
			mockMarkAsRead.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Notification not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent" },
				jwtPayload: mockUserJWT,
			})

			await NotificationController.markAsRead(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── markAllAsRead ────────────────────────────────────────────────────────

	describe("markAllAsRead", () => {
		it("should return 200 on successful mark all as read", async () => {
			mockMarkAllAsRead.mockResolvedValue({ status: true, data: { updated: 10 } })

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await NotificationController.markAllAsRead(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully marked all notifications as read!",
			})
		})

		it("should return error status when service fails", async () => {
			mockMarkAllAsRead.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				jwtPayload: mockUserJWT,
			})

			await NotificationController.markAllAsRead(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── deleteById ──────────────────────────────────────────────────────────

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({ status: true, data: {} })

			const { mock, spy } = createMockContext({
				params: { id: "notif-1" },
				jwtPayload: mockUserJWT,
			})

			await NotificationController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully deleted notification!",
			})
		})

		it("should return 404 when notification not found", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Notification not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent" },
				jwtPayload: mockUserJWT,
			})

			await NotificationController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})
})

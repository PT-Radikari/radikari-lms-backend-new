/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { createMockContext } from "$tests/helpers/mockContext"
import { mockUserJWT } from "$factories/assignment"

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warn: jest.fn<any>(),
}))

let mockCreate = jest.fn<any>()
let mockGetAll = jest.fn<any>()
let mockGetById = jest.fn<any>()
let mockUpdate = jest.fn<any>()
let mockDeleteById = jest.fn<any>()
let mockLikeForum = jest.fn<any>()
let mockCommentForum = jest.fn<any>()
let mockGetForumComments = jest.fn<any>()
let mockGetForumCommentReplies = jest.fn<any>()
let mockDeleteForumComment = jest.fn<any>()
let mockLikeOrUnlikeForumComment = jest.fn<any>()
let mockPinOrUnpinForum = jest.fn<any>()

jest.mock("$services/ForumService", () => ({
	create: (...args: any[]) => mockCreate(...args),
	getAll: (...args: any[]) => mockGetAll(...args),
	getById: (...args: any[]) => mockGetById(...args),
	update: (...args: any[]) => mockUpdate(...args),
	deleteById: (...args: any[]) => mockDeleteById(...args),
	likeForum: (...args: any[]) => mockLikeForum(...args),
	commentForum: (...args: any[]) => mockCommentForum(...args),
	getForumComments: (...args: any[]) => mockGetForumComments(...args),
	getForumCommentReplies: (...args: any[]) => mockGetForumCommentReplies(...args),
	deleteForumComment: (...args: any[]) => mockDeleteForumComment(...args),
	likeOrUnlikeForumComment: (...args: any[]) => mockLikeOrUnlikeForumComment(...args),
	pinOrUnpinForum: (...args: any[]) => mockPinOrUnpinForum(...args),
}))

import * as ForumController from "$controllers/rest/ForumController"

describe("ForumController", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	// ─── create ─────────────────────────────────────────────────────────────

	describe("create", () => {
		it("should return 201 with created forum on success", async () => {
			const mockForum = { id: "forum-123", title: "Test Forum", tenantId: "tenant-test-123" }
			mockCreate.mockResolvedValue({ status: true, data: mockForum })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Test Forum" },
			})

			await ForumController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully created new Forum!",
				content: expect.objectContaining({ id: "forum-123" }),
			})
		})

		it("should return error status from service on failure", async () => {
			mockCreate.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Validation error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Test Forum" },
			})

			await ForumController.create(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getAll ─────────────────────────────────────────────────────────────

	describe("getAll", () => {
		it("should return 200 with paginated forums on success", async () => {
			mockGetAll.mockResolvedValue({ status: true, data: { data: [], total: 0 } })

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await ForumController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched all Forum!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetAll.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await ForumController.getAll(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getById ────────────────────────────────────────────────────────────

	describe("getById", () => {
		it("should return 200 with forum on success", async () => {
			const mockForum = { id: "forum-123", title: "Test Forum" }
			mockGetById.mockResolvedValue({ status: true, data: mockForum })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched Forum by id!",
			})
		})

		it("should return 404 when forum not found", async () => {
			mockGetById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Forum not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.getById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── update ─────────────────────────────────────────────────────────────

	describe("update", () => {
		it("should return 200 with updated forum on success", async () => {
			const mockForum = { id: "forum-123", title: "Updated Title" }
			mockUpdate.mockResolvedValue({ status: true, data: mockForum })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Updated Title" },
			})

			await ForumController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully updated Forum!",
			})
		})

		it("should return error status when service fails", async () => {
			mockUpdate.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Update failed" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { title: "Updated" },
			})

			await ForumController.update(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── deleteById ─────────────────────────────────────────────────────────

	describe("deleteById", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteById.mockResolvedValue({ status: true, data: {} })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully deleted Forum!",
			})
		})

		it("should return 404 when forum not found", async () => {
			mockDeleteById.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Forum not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "nonexistent", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.deleteById(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── likeForum ─────────────────────────────────────────────────────────

	describe("likeForum", () => {
		it("should return 201 on successful like", async () => {
			const mockLike = { forumId: "forum-123", userId: "user-123" }
			mockLikeForum.mockResolvedValue({ status: true, data: mockLike })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.likeForum(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully liked Forum!",
			})
		})

		it("should return error status when service fails", async () => {
			mockLikeForum.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Already liked" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.likeForum(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── commentForum ───────────────────────────────────────────────────────

	describe("commentForum", () => {
		it("should return 201 with created comment on success", async () => {
			const mockComment = { id: "comment-123", forumId: "forum-123", content: "Nice!" }
			mockCommentForum.mockResolvedValue({ status: true, data: mockComment })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { content: "Nice!" },
			})

			await ForumController.commentForum(mock)

			expect(spy.status).toHaveBeenCalledWith(201)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully commented Forum!",
			})
		})

		it("should return error status when service fails", async () => {
			mockCommentForum.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Comment failed" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
				body: { content: "Test" },
			})

			await ForumController.commentForum(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})

	// ─── getForumComments ───────────────────────────────────────────────────

	describe("getForumComments", () => {
		it("should return 200 with comments on success", async () => {
			mockGetForumComments.mockResolvedValue({ status: true, data: { data: [], total: 0 } })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await ForumController.getForumComments(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched Forum comments!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetForumComments.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "forum-123" },
				jwtPayload: mockUserJWT,
				query: {},
			})

			await ForumController.getForumComments(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── getForumCommentReplies ─────────────────────────────────────────────

	describe("getForumCommentReplies", () => {
		it("should return 200 with replies on success", async () => {
			mockGetForumCommentReplies.mockResolvedValue({ status: true, data: { data: [], total: 0 } })

			const { mock, spy } = createMockContext({
				params: { commentId: "comment-123" },
				query: {},
			})

			await ForumController.getForumCommentReplies(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully fetched Forum comment replies!",
			})
		})

		it("should return error status when service fails", async () => {
			mockGetForumCommentReplies.mockResolvedValue({
				status: false,
				err: { code: 500, message: "Internal Server Error" },
			})

			const { mock, spy } = createMockContext({
				params: { commentId: "comment-123" },
				query: {},
			})

			await ForumController.getForumCommentReplies(mock)

			expect(spy.status).toHaveBeenCalledWith(500)
		})
	})

	// ─── deleteForumComment ─────────────────────────────────────────────────

	describe("deleteForumComment", () => {
		it("should return 200 on successful deletion", async () => {
			mockDeleteForumComment.mockResolvedValue({ status: true, data: {} })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", commentId: "comment-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.deleteForumComment(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully deleted Forum comment!",
			})
		})

		it("should return 404 when comment not found", async () => {
			mockDeleteForumComment.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Comment not found" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", commentId: "nonexistent", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.deleteForumComment(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── likeOrUnlikeForumComment ──────────────────────────────────────────

	describe("likeOrUnlikeForumComment", () => {
		it("should return 200 on successful like/unlike", async () => {
			const mockLike = { commentId: "comment-123", userId: "user-123", liked: true }
			mockLikeOrUnlikeForumComment.mockResolvedValue({ status: true, data: mockLike })

			const { mock, spy } = createMockContext({
				params: { commentId: "comment-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.likeOrUnlikeForumComment(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully liked or unliked Forum comment!",
			})
		})

		it("should return error status when service fails", async () => {
			mockLikeOrUnlikeForumComment.mockResolvedValue({
				status: false,
				err: { code: 404, message: "Comment not found" },
			})

			const { mock, spy } = createMockContext({
				params: { commentId: "nonexistent" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.likeOrUnlikeForumComment(mock)

			expect(spy.status).toHaveBeenCalledWith(404)
		})
	})

	// ─── pinOrUnpinForum ───────────────────────────────────────────────────

	describe("pinOrUnpinForum", () => {
		it("should return 200 on successful pin/unpin", async () => {
			const mockForum = { id: "forum-123", isPinned: true }
			mockPinOrUnpinForum.mockResolvedValue({ status: true, data: mockForum })

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.pinOrUnpinForum(mock)

			expect(spy.status).toHaveBeenCalledWith(200)
			expect(spy.json.mock.calls[0][0]).toMatchObject({
				message: "Successfully pinned or unpinned Forum!",
			})
		})

		it("should return error status when service fails", async () => {
			mockPinOrUnpinForum.mockResolvedValue({
				status: false,
				err: { code: 400, message: "Not authorized" },
			})

			const { mock, spy } = createMockContext({
				params: { id: "forum-123", tenantId: "tenant-test-123" },
				jwtPayload: mockUserJWT,
			})

			await ForumController.pinOrUnpinForum(mock)

			expect(spy.status).toHaveBeenCalledWith(400)
		})
	})
})

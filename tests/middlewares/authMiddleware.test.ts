/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from "@jest/globals"

jest.mock("$repositories/TenantRepository", () => ({
	getById: jest.fn<any>(),
}))

jest.mock("$repositories/TenantUserRepository", () => ({
	getByTenantIdAndUserId: jest.fn<any>(),
}))

jest.mock("$repositories/TenantRoleRepository", () => ({
	getByUserId: jest.fn<any>(),
}))

jest.mock("jsonwebtoken", () => ({
	verify: jest.fn(),
}))

jest.mock("$pkg/logger", () => ({
	info: jest.fn<any>(),
	error: jest.fn<any>(),
	warning: jest.fn<any>(),
}))

jest.mock("hono/cookie", () => ({
	getCookie: jest.fn<any>(),
}))

const mockPrisma = {
	user: {
		findUnique: jest.fn<any>(),
	},
	accessControlList: {
		findFirst: jest.fn<any>(),
	},
}
jest.mock("$pkg/prisma", () => ({
	prisma: mockPrisma,
}))

import { createMockContext } from "$tests/helpers/mockContext"
import {
	checkJwt,
	checkRole,
	checkRoleInTenant,
	checkAccessTenantRole,
	checkRoleOrSameUser,
	checkRoleAssignmentAccess,
} from "$middlewares/authMiddleware"
import { Roles } from "$generated/prisma/client"
import jwt from "jsonwebtoken"

describe("authMiddleware", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe("checkJwt", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should return 401 when no Authorization header and no cookie", async () => {
			const cookieMock = jest.requireMock("hono/cookie") as any
			cookieMock.getCookie.mockReturnValue(undefined)

			const { mock: ctx } = createMockContext({ headers: {} })

			const result = await checkJwt(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should return 401 when Authorization header is not Bearer", async () => {
			const cookieMock = jest.requireMock("hono/cookie") as any
			cookieMock.getCookie.mockReturnValue(undefined)

			const { mock: ctx } = createMockContext({
				headers: { Authorization: "Basic abc123" },
			})

			await checkJwt(ctx as any, next)
			expect(next).not.toHaveBeenCalled()
		})

		it("should return 401 when token is invalid", async () => {
			;(jwt.verify as jest.Mock).mockImplementation(() => {
				throw new Error("Invalid token")
			})
			const cookieMock = jest.requireMock("hono/cookie") as any
			cookieMock.getCookie.mockReturnValue(undefined)

			const { mock: ctx } = createMockContext({
				headers: { Authorization: "Bearer invalid_token" },
			})

			await checkJwt(ctx as any, next)
			expect(next).not.toHaveBeenCalled()
		})

		it("should set jwtPayload and call next when token is valid", async () => {
			const payload = { id: "user-123", email: "test@test.com", role: "ADMIN" }
			;(jwt.verify as jest.Mock).mockReturnValue(payload)
			const cookieMock = jest.requireMock("hono/cookie") as any
			cookieMock.getCookie.mockReturnValue(undefined)

			const { mock: ctx } = createMockContext({
				headers: { Authorization: "Bearer valid_token" },
			})

			await checkJwt(ctx as any, next)
			expect(ctx.get("jwtPayload")).toEqual(payload)
			expect(next).toHaveBeenCalledTimes(1)
		})

		it("should read token from radikari-session cookie when present", async () => {
			const payload = { id: "user-456", email: "test2@test.com", role: "USER" }
			;(jwt.verify as jest.Mock).mockReturnValue(payload)
			const cookieMock = jest.requireMock("hono/cookie") as any
			cookieMock.getCookie.mockReturnValue(JSON.stringify({ accessToken: "cookie_token" }))

			const { mock: ctx } = createMockContext({ headers: {} })

			await checkJwt(ctx as any, next)
			expect(cookieMock.getCookie).toHaveBeenCalledWith(ctx, "radikari-session")
			expect(jwt.verify).toHaveBeenCalledWith("cookie_token", expect.any(String))
			expect(next).toHaveBeenCalled()
		})
	})

	describe("checkRole", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should call next when user role is in allowed roles", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.ADMIN },
			})

			await checkRole([Roles.ADMIN, Roles.USER])(ctx as any, next)
			expect(next).toHaveBeenCalledTimes(1)
		})

		it("should return 403 when user role is not in allowed roles", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
			})

			const result = await checkRole([Roles.ADMIN])(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should treat missing role as USER", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com" },
			})

			await checkRole([Roles.ADMIN])(ctx as any, next)
			expect(next).not.toHaveBeenCalled()
		})
	})

	describe("checkRoleInTenant", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should call next when user is ADMIN (bypass tenant check)", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "admin-1", email: "a@b.com", role: Roles.ADMIN },
				params: { tenantId: "tenant-123" },
			})

			await checkRoleInTenant(ctx as any, next)
			expect(tenantRepo.getById).not.toHaveBeenCalled()
			expect(next).toHaveBeenCalled()
		})

		it("should call next when user is HEAD_OF_OFFICE in tenant (bypass tenant check)", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const { mock: ctx } = createMockContext({
				jwtPayload: {
					id: "checker-1",
					email: "checker@b.com",
					role: Roles.USER,
					tenantRoleName: "HEAD_OF_OFFICE",
				},
				params: { tenantId: "tenant-123" },
			})

			await checkRoleInTenant(ctx as any, next)
			expect(tenantRepo.getById).not.toHaveBeenCalled()
			expect(next).toHaveBeenCalled()
		})

		it("should return 403 when tenant does not exist", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			tenantRepo.getById.mockResolvedValue(null)

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "nonexistent-tenant" },
			})

			const result = await checkRoleInTenant(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should return 403 when user is not a tenant member", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantUserRepo = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantUserRepo.getByTenantIdAndUserId.mockResolvedValue(null)

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			const result = await checkRoleInTenant(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should call next when user is a valid tenant member", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantUserRepo = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantUserRepo.getByTenantIdAndUserId.mockResolvedValue({
				id: "tu-1",
				tenantId: "tenant-123",
				userId: "user-1",
			})

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			await checkRoleInTenant(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should return 403 when tenantId param is missing", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: {},
			})

			const result = await checkRoleInTenant(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})
	})

	describe("checkAccessTenantRole", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should call next when user is ADMIN (bypass ACL check)", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "admin-1", email: "a@b.com", role: Roles.ADMIN },
				params: { tenantId: "tenant-123" },
			})

			await checkAccessTenantRole("KNOWLEDGE", "CREATE")(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should call next when user is HEAD_OF_OFFICE (bypass ACL check)", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: {
					id: "checker-1",
					email: "checker@b.com",
					role: Roles.USER,
					tenantRoleName: "HEAD_OF_OFFICE",
				},
				params: { tenantId: "tenant-123" },
			})

			await checkAccessTenantRole("KNOWLEDGE", "CREATE")(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should call next when user is ADMIN (bypass ACL check)", async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null)

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "admin-1", email: "a@b.com", role: Roles.ADMIN },
				params: { tenantId: "tenant-123" },
			})

			await checkAccessTenantRole("KNOWLEDGE", "CREATE")(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should return 403 when user has no ACL entry for feature+action", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({
				id: "user-1",
				tenantUser: [{ tenantRoleId: "role-1" }],
			})
			mockPrisma.accessControlList.findFirst.mockResolvedValue(null)

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			const result = await checkAccessTenantRole("KNOWLEDGE", "CREATE")(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should call next when user has ACL entry for feature+action", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({
				id: "user-1",
				tenantUser: [{ tenantRoleId: "role-1" }],
			})
			mockPrisma.accessControlList.findFirst.mockResolvedValue({ id: "acl-1" })

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			await checkAccessTenantRole("KNOWLEDGE", "CREATE")(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should return 403 when user is not a member of tenant", async () => {
			mockPrisma.user.findUnique.mockResolvedValue({
				id: "user-1",
				tenantUser: [],
			})

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			const result = await checkAccessTenantRole("KNOWLEDGE", "CREATE")(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})
	})

	describe("checkRoleOrSameUser", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should call next when user role is allowed", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.ADMIN },
				params: { id: "other-user" },
			})

			await checkRoleOrSameUser([Roles.ADMIN])(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should call next when user is accessing their own resource", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { id: "user-1" },
			})

			await checkRoleOrSameUser([Roles.ADMIN])(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should return 403 when user role not allowed and not same user", async () => {
			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { id: "other-user" },
			})

			const result = await checkRoleOrSameUser([Roles.ADMIN])(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})
	})

	describe("tenantRoleName in JWT payload", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should read tenantRoleName from jwtPayload when user is in tenant", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantUserRepo = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantUserRepo.getByTenantIdAndUserId.mockResolvedValue({
				id: "tu-1",
				tenantId: "tenant-123",
				userId: "user-1",
				tenantRole: { id: "role-1", name: "Checker" },
			})

			const { mock: ctx } = createMockContext({
				jwtPayload: {
					id: "user-1",
					email: "a@b.com",
					role: Roles.USER,
					tenantRoleName: "Checker",
				},
				params: { tenantId: "tenant-123" },
			})

			await checkRoleInTenant(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})

		it("should include tenantRoleName=Maker when user has Maker role in tenant", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantUserRepo = jest.requireMock("$repositories/TenantUserRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantUserRepo.getByTenantIdAndUserId.mockResolvedValue({
				id: "tu-1",
				tenantId: "tenant-123",
				userId: "user-1",
				tenantRole: { id: "role-2", name: "Maker" },
			})

			const { mock: ctx } = createMockContext({
				jwtPayload: {
					id: "user-1",
					email: "maker@b.com",
					role: Roles.USER,
					tenantRoleName: "Maker",
				},
				params: { tenantId: "tenant-123" },
			})

			await checkRoleInTenant(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})
	})

	describe("checkRoleAssignmentAccess", () => {
		const next = jest.fn<() => Promise<void>>()

		it("should call next when user is ADMIN (bypass role check)", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantRoleRepo = jest.requireMock("$repositories/TenantRoleRepository") as any

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "admin-1", email: "a@b.com", role: Roles.ADMIN },
				params: { tenantId: "tenant-123" },
			})

			await checkRoleAssignmentAccess(["TEACHER"])(ctx as any, next)
			// ADMIN bypasses role check so only tenant lookup happens
			expect(tenantRepo.getById).toHaveBeenCalledWith("tenant-123")
			expect(tenantRoleRepo.getByUserId).not.toHaveBeenCalled()
			expect(next).toHaveBeenCalled()
		})

		it("should return 403 when tenant does not exist", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			tenantRepo.getById.mockResolvedValue(null)

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "nonexistent" },
			})

			const result = await checkRoleAssignmentAccess(["TEACHER"])(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should return 403 when user has no tenant roles", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantRoleRepo = jest.requireMock("$repositories/TenantRoleRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantRoleRepo.getByUserId.mockResolvedValue([])

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			const result = await checkRoleAssignmentAccess(["TEACHER"])(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should return 403 when user role does not match assignment access", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantRoleRepo = jest.requireMock("$repositories/TenantRoleRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantRoleRepo.getByUserId.mockResolvedValue([{ identifier: "STUDENT" }])

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			const result = await checkRoleAssignmentAccess(["TEACHER"])(ctx as any, next)
			expect(result).toBeDefined()
			expect(next).not.toHaveBeenCalled()
		})

		it("should call next when user role matches assignment access", async () => {
			const tenantRepo = jest.requireMock("$repositories/TenantRepository") as any
			const tenantRoleRepo = jest.requireMock("$repositories/TenantRoleRepository") as any
			tenantRepo.getById.mockResolvedValue({ id: "tenant-123" })
			tenantRoleRepo.getByUserId.mockResolvedValue([{ identifier: "TEACHER" }])

			const { mock: ctx } = createMockContext({
				jwtPayload: { id: "user-1", email: "a@b.com", role: Roles.USER },
				params: { tenantId: "tenant-123" },
			})

			await checkRoleAssignmentAccess(["TEACHER"])(ctx as any, next)
			expect(next).toHaveBeenCalled()
		})
	})
})

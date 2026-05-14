/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { transformRoleToEnumRole } from "$utils/user.utils"
import { Roles } from "$generated/prisma/client"

describe("user.utils", () => {
	describe("transformRoleToEnumRole", () => {
		it("should return ADMIN for 'ADMIN' string", () => {
			const result = transformRoleToEnumRole("ADMIN")
			expect(result).toBe(Roles.ADMIN)
		})

		it("should return USER for unknown role strings", () => {
			expect(transformRoleToEnumRole("USER")).toBe(Roles.USER)
			expect(transformRoleToEnumRole("TEACHER")).toBe(Roles.USER)
			expect(transformRoleToEnumRole("STUDENT")).toBe(Roles.USER)
			expect(transformRoleToEnumRole("")).toBe(Roles.USER)
			expect(transformRoleToEnumRole("invalid")).toBe(Roles.USER)
		})
	})
})

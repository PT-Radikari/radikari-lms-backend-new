/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "@jest/globals"
import { AnnouncementSchema } from "$validations/schema/AnnouncementSchema"

describe("AnnouncementSchema", () => {
	it("should pass with valid announcement data", () => {
		const result = AnnouncementSchema.safeParse({
			title: "System Maintenance",
			content: "The system will be down on Sunday.",
			tenantRoleIds: ["role-1", "role-2"],
		})
		expect(result.success).toBe(true)
	})

	it("should pass with empty tenantRoleIds array", () => {
		const result = AnnouncementSchema.safeParse({
			title: "General Notice",
			content: "This is a general notice.",
			tenantRoleIds: [],
		})
		expect(result.success).toBe(true)
	})

	it("should fail when title is missing", () => {
		const result = AnnouncementSchema.safeParse({
			content: "Some content",
			tenantRoleIds: ["role-1"],
		})
		expect(result.success).toBe(false)
	})

	it("should fail when content is missing", () => {
		const result = AnnouncementSchema.safeParse({
			title: "Title",
			tenantRoleIds: ["role-1"],
		})
		expect(result.success).toBe(false)
	})

	it("should fail when tenantRoleIds is missing", () => {
		const result = AnnouncementSchema.safeParse({
			title: "Title",
			content: "Content",
		})
		expect(result.success).toBe(false)
	})

	it("should fail with extra fields", () => {
		const result = AnnouncementSchema.safeParse({
			title: "Title",
			content: "Content",
			tenantRoleIds: ["role-1"],
			isActive: true,
		})
		expect(result.success).toBe(false)
	})
})

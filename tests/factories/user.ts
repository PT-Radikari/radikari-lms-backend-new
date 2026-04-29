/* eslint-disable @typescript-eslint/no-explicit-any */
import { Roles, UserType } from "$generated/prisma/client"

export const mockUser = {
	id: "user-test-123",
	email: "test@example.com",
	fullName: "Test User",
	password: "$2a$12$mockhashedpassword",
	phoneNumber: "08123456789",
	role: Roles.USER,
	type: UserType.INTERNAL,
	isActive: true,
	isDeleted: false,
	createdAt: new Date(),
	updatedAt: new Date(),
} as any

export const mockUserAdmin = {
	...mockUser,
	id: "admin-test-123",
	fullName: "Test Admin",
	role: Roles.ADMIN,
} as any

export const mockUserTeacher = {
	...mockUser,
	id: "teacher-test-123",
	fullName: "Test Teacher",
	role: Roles.USER,
} as any

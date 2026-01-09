import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/dbConnect";
import UserModel from "@/model/User";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { phone, password } = await req.json();

        if (!phone || !password) {
            return NextResponse.json(
                { message: "Phone and Password are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await UserModel.findOne({ phone });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await UserModel.create({
            phone,
            password: hashedPassword,
            role: "PARKER", // Default role for self-registration
        });

        return NextResponse.json(
            { message: "User registered successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

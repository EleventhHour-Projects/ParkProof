import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
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

        // find user : password is select:false, so explicitly include 
        const user = await UserModel.findOne({ phone }).select("+password");

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { message: "You are not authorized to login" },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        // create session token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: "7d",
            }
        );

        const response = NextResponse.json(
            {
                message: "Login successful",
                role: user.role,
            },
            { status: 200 }
        );

        // set http-only cookie
        response.cookies.set("session", token, {
            httpOnly: true, // this means js is not allowed to read or modify this cookie
            secure: process.env.NODE_ENV === "production", // a cookie with secure: true is stored only over HTTPS
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

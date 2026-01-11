import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession(req);
        if (!session || session.role !== 'ATTENDANT') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();

        // Forward to Go Backend
        const goRes = await fetch("http://127.0.0.1:8000/api/upload", {
            method: "POST",
            body: formData, // fetch automatically sets Content-Type to multipart/form-data with boundary
        });

        if (!goRes.ok) {
            console.error("Upload Proxy Error:", goRes.status);
            return NextResponse.json({ message: "Upload failed" }, { status: 502 });
        }

        const data = await goRes.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error("Upload Proxy Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

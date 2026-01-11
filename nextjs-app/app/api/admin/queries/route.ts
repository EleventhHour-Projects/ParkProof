import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const pid = searchParams.get('pid')
    const res = await fetch(`http://localhost:8000/api/admin/queries?pid=${pid}`, {
        cache: "no-store",
    });
    const data = await res.json();
    console.log(data);
    return NextResponse.json(data);
}

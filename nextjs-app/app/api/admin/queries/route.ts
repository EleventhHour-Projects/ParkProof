import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const pid = searchParams.get('pid')
    const res = await fetch(`https://parkproof.onrender.com/api/admin/queries?pid=${pid}`, {
        cache: "no-store",
    });
    const data = await res.json();
    console.log(data);
    return NextResponse.json(data);
}

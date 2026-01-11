import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import ReportModel from "@/model/Report";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        // In Next.js 15+, params is a Promise that needs to be awaited. 
        // However, the standard signature for app router route handlers often treats it as direct usage or awaited depending on version.
        // For safety in 15 or complex scenarios, we can just use it. 
        // Actually, in the latest Next.js versions (including 15 canary), `params` should be awaited if we want to be future proof, 
        // but typically the second argument is just `{ params }`.

        // Let's first try direct access.
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { message: "Report ID is required" },
                { status: 400 }
            );
        }

        const deletedReport = await ReportModel.findByIdAndDelete(id);

        if (!deletedReport) {
            return NextResponse.json(
                { message: "Report not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Report deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete report API error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

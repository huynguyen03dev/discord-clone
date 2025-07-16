import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function PATCH(request: Request, { params }: { params: Promise<{ serverId: string }> }) {
    try {
        const { serverId } = await params;
        const profile = await currentProfile();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!serverId) {
            return new NextResponse("Server ID is missing", { status: 400 });
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id // Ensure the server belongs to the current profile
            },
            data: {
                // Update the server data as needed
                inviteCode: uuidv4() // Generate a new invite code
            }
        });

        return NextResponse.json(server);
    } catch (error) {
        console.error("[SERVER_ID]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
        
    }
}
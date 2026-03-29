import { Prisma } from "@prisma/client";
import type { Profile } from "@prisma/client";
import { currentUser, auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export const initialProfile = async (): Promise<Profile | Response> => {
    const user = await currentUser();

    if (!user) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    const existingProfile = await db.profile.findUnique({
        where: {
            userId: user.id
        }
    });

    if (existingProfile) {
        return existingProfile;
    }

    const profileData = {
        userId: user.id,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.id,
        imageUrl: user.imageUrl,
        email: user.emailAddresses?.[0]?.emailAddress ?? ""
    };

    try {
        return await db.profile.create({
            data: profileData
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const fallbackProfile = await db.profile.findUnique({
                where: {
                    userId: user.id
                }
            });

            if (fallbackProfile) {
                return fallbackProfile;
            }
        }

        throw error;
    }
}

import type { Profile } from "@prisma/client";
import { currentUser, auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export const initialProfile = async (): Promise<Profile> => {
    const user = await currentUser();

    if (!user) {
        const { redirectToSignIn } = await auth();
        redirectToSignIn();
        throw new Error("Redirect to sign-in did not complete.");
    }

    const profile = await db.profile.upsert({
        where: {
            userId: user.id
        },
        update: {},
        create: {
            userId: user.id,
            name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.id,
            imageUrl: user.imageUrl,
            email: user.emailAddresses?.[0]?.emailAddress ?? ""
        }
    });
    
    return profile;
}

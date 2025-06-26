import { InitialModal } from "@/components/modals/inital-modal";
import { db } from "@/lib/db";
import { initalProfile } from "@/lib/inital-profile";
import { redirect } from "next/navigation";

const SetupPage = async () => {
  const profile = await initalProfile();

  const server = await db.server.findFirst({
    where: {
      members: {
        some: {
          profileId: profile.id
        }
      }
    }
  });

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

return <InitialModal />;
}

export default SetupPage;
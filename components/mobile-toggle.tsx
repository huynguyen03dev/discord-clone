import { Menu } from "lucide-react"

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "./ui/button"
import { NavigationSidebar } from "./navigations/navigation-sidebar"
import { ServerSidebar } from "./server/server-sidebar"

interface MobileToggleProps {
  serverId: string;
}

export const MobileToggle = ({ serverId }: MobileToggleProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu/>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex gap-0 [&>button]:hidden">
        {/* Visually hidden title for screen readers */}
        <SheetTitle className="sr-only">
          Navigation Menu
        </SheetTitle>
        <div className="w-full h-full flex">
          <div className="w-[72px] h-full">
            <NavigationSidebar />
          </div>
          <ServerSidebar serverId={serverId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

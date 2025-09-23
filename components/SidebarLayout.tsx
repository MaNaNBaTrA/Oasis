"use client";

import { usePathname } from "next/navigation";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const authPages = ['/signin', '/signup', '/login', '/register'];
  const isAuthPage = authPages.includes(pathname);
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="w-full h-screen flex overflow-hidden">
      <div className="fixed left-0 top-0 h-full w-[20%] z-10">
        <LeftSidebar />
      </div>
      
      <div className="flex-1 ml-[20%] mr-[20%] h-full overflow-y-auto scrollbar-hide">
        <div className="p-6">
          {children}
        </div>
      </div>
      
      <div className="fixed right-0 top-0 h-full w-[20%] z-10">
        <RightSidebar />
      </div>
      
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
import { BarChart2, LayoutDashboard, PanelLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className=" h-screen overflow-hidden">

      <div className="flex flex-col gap-4 p-6 md:p-10">
        
        <div className="flex flex-col items-center justify-center p-10">
          <img
            src="/img/nasa.png"
            alt="Logo GlobalLifeCities"
            className="h-24 w-24 md:h-32 md:w-32 rounded-xl"
          />
        </div>




        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>

      
    </div>
  );
}

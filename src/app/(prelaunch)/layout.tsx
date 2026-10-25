import { publicFontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export default function PrelaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(publicFontVariables, "min-h-screen bg-brand-ground font-ui text-brand-body antialiased")}>
      {children}
    </div>
  );
}

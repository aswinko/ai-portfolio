"use client";

// import { Tabs, TabsList, TabsTrigger } from "ui/components/tabs";
import { useTheme } from "next-themes";

function ThemeTabs() {
  const { setTheme, theme } = useTheme();

  const handleSwitch = () => {
    console.log(theme)
    return setTheme(theme=== "dark"?"light":"dark")
  }

  return (
   <div className="absolute top-5 right-5 text-black dark:text-white">
        <button
        onClick={handleSwitch}
        >
switch

        </button>
   </div>
  );
}


export default ThemeTabs;
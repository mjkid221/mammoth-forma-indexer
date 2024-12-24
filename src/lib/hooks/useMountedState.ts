import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";

/**
 * This hook is used to add a transition effect to the UI when the component is mounted.
 * It is used to prevent the UI from flashing when the component is mounted.
 */
export const useMountedState = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getMountedStateClasses = (activeClasses: string) => {
    return cn(
      "transition-colors duration-300",
      isMounted
        ? activeClasses
        : "data-[state=active]:bg-transparent data-[state=active]:text-inherit",
    );
  };

  return {
    isMounted,
    getMountedStateClasses,
  };
};

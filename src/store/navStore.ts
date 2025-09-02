// navStore.ts
import { create } from "zustand";

interface NavState {
    isNavExpanded: boolean;
    setNavExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
}

export const useNavStore = create<NavState>((set) => ({
    isNavExpanded: false,
    setNavExpanded: (expanded) =>
        set((state) => ({
            isNavExpanded:
                typeof expanded === "function" ? expanded(state.isNavExpanded) : expanded,
        })),
}));

/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {WorldModel} from "../models/worldModel";
import {Vector3} from "three";
import {ElementModel} from "../models/elementModel";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;
    worlds: { [key: string]: WorldModel };
    createNewWorld: () => void;
    getWorld: (name: string) => WorldModel;

    heliodon: boolean;
    latitude: number;
    date: string;
}

export const useStore = create<CommonStoreState>(devtools(persist((
    set,
    get,
    api,
) => {
    const immerSet: CommonStoreState['set'] = fn => set(produce(fn));
    return {

        set: immerSet,

        heliodon: false,
        latitude: 42,
        date: new Date(2021, 5, 22, 12).toString(),

        worlds: {},
        getWorld(name: string) {
            return get().worlds[name];
        },
        createNewWorld() {
            immerSet((state: CommonStoreState) => {
                const elements: ElementModel[] = [];
                const e1 = {type: 'Foundation', cx: 0, cy: 0, lx: 2, ly: 4, height: 0.1, id: 'f1'};
                const e2 = {type: 'Foundation', cx: 1, cy: 2, lx: 2, ly: 2, height: 0.2, id: 'f2'};
                elements.push(e1);
                elements.push(e2);
                const world = {
                    name: 'default',
                    elements: elements,
                    cameraPosition: new Vector3(0, 0, 5)
                };
                state.worlds[world.name] = world;
            })
        }
    };
}, {name: 'aladdin-storage'})));


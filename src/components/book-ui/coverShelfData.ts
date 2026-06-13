import type { DictKey } from "@/lib/i18n/dictionary";
import type { CoverStyleId } from "./bookTypes";

export interface CoverDef {
  id: CoverStyleId;
  labelKey: DictKey;
  descKey: DictKey;
  src: string;
}

export const COVERS: CoverDef[] = [
  {
    id: "stone",
    labelKey: "cover.stone.label",
    descKey: "cover.stone.desc",
    src: "/covers/stone.png",
  },
  {
    id: "archive",
    labelKey: "cover.archive.label",
    descKey: "cover.archive.desc",
    src: "/covers/archive.png",
  },
  {
    id: "1950",
    labelKey: "cover.1950.label",
    descKey: "cover.1950.desc",
    src: "/covers/classic.png",
  },
  {
    id: "1980",
    labelKey: "cover.1980.label",
    descKey: "cover.1980.desc",
    src: "/covers/sketch.png",
  },
  {
    id: "1990",
    labelKey: "cover.1990.label",
    descKey: "cover.1990.desc",
    src: "/covers/pop.png",
  },
  {
    id: "2000",
    labelKey: "cover.2000.label",
    descKey: "cover.2000.desc",
    src: "/covers/kitsch.png",
  },
  {
    id: "2010",
    labelKey: "cover.2010.label",
    descKey: "cover.2010.desc",
    src: "/covers/minimal.png",
  },
];

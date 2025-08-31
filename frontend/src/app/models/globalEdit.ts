import { BlockObject } from "./box-models/BlockObject";



export class MiniPage {
    constructor(public id: number, public textboxes: BlockObject[]) {}
}


export class GlobalEdit {
    constructor(
        public pageEdits: MiniPage[],
        public deletedPages: number[]
    ) { }
}

export interface Payload {
  edits: GlobalEdit;
  signed_id: string;
}
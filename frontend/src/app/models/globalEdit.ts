import { TextBox } from "./TextBox";



export class MiniPage {
    constructor(public id: number, public textboxes: TextBox[]) {}
}


export class GlobalEdit {
    constructor(
        public pageEdits: MiniPage[],
        public deletedPages: number[]
    ) { }
}
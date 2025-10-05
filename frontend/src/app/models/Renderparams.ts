/**
 *  @param pageNumber
 * @param scale
 * @param container
 * @param isDummyPage
 * @param isPreviewPage
 * @param isEmpty
 * @param isOrganize
 * @param isNavigator
 * @param rotation
 */
export class RenderParams {
  constructor(
    public pageNumber: number = 1,
    public rotation: number = 0,
    public scale: number = 1.0,
    public isDummyPage: Boolean = false,
    public isPreviewPage: Boolean = false,
    public isOrganize: Boolean = false,
    public isNavigator: Boolean = false,
    public container: any,
  ) {}
}

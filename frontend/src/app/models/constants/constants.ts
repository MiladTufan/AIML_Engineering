

export class Constants {

    // routes
    public static EDIT_PDF_VIEW: string = "edit-pdf-view";
    public static CREDITS_VIEW: string = "credits-view";
    public static DELETE_VIEW: string = "delete-view";
    public static ORGANIZE_VIEW: string = "organize-view";

    // overlay constants
    public static OVERLAY_TEXT: string = ".text-box-layer";
    public static OVERLAY_IMG: string = ".img-box-layer";
    public static OVERLAY_STACK_PAGES_HORIZONTALLY: string = "relative inline-block mt-4";


    // Events
    public static EVENT_POSITION_CHANGED: string = "positionChanged"
    public static EVENT_ASSIGN_AND_CREATE_NEW_OBJ: string = "assignAndCreateNewObj"
    public static EVENT_ENTITY_MANAGER_EMIT: string = "entityManagerService"
    

    
    // ERROR messages
    public static ERROR_INVALID_FILETYPE: string = "You uploaded a non-PDF file. Please upload a valid PDF document only."
    public static ERROR_INVALID_FILETYPE_TITLE: string = "Invalid File Type"
    public static ERROR_NO_PARENT_CONTAINER: string = "No Parent Container found!"
    public static ERROR_DROPTARGET_UNKNOWN: string = "Drop target for Dragging is unknown! Can not move!"
    public static ERROR_IMG_BOX_NULL: string = "Image Box is null in resizeObserver! Can not resize!"
    public static ERROR_CANNOT_REMOVE_BOX: string = "Can not remove box! It does not exist in the first place!"

    

    

}
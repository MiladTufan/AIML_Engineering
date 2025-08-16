
    

export class Environment {

    // API URLS
    public static API_BASE_URL: string = "http://localhost:8000/session"
    



    // Download URLS
    public static BACKEND_DOWNLOAD_ENDPOINT: string = "/download-pdf";


    // upload URLS
    public static BACKEND_UPLOAD_ENDPOINT: string = "/upload-pdf";
    public static BACKEND_GET_PDF_ENDPOINT: string = "/get-pdf"
    public static BACKEND_GET_EDITS_ENDPOINT: string = "/get-edits"
    public static BACKEND_EMBED_PDF_ENDPOINT: string = "/save-pdf-edits";

    // session URLS
    public static BACKEND_CREATE_SESSION_ENDPOINT: string = "/create-session"
    public static BACKEND_DELETE_SESSION_ENDPOINT: string = "/delete-session"
    public static BACKEND_GET_SIGNED_SIDS_ENDPOINT: string = "/get-all-signed-sids"

    

}


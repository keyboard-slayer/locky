const CLIENT_ID = 'wix0yxqf56vnor9';

let accessToken = null;

export async function getAuthenticationUrl() {
    const redirectUrl = (document.location.origin + document.location.pathname).replace(
        /\/+$/,
        '',
    );

    const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID });
    const authUrl = await dbx.auth.getAuthenticationUrl(redirectUrl);
    return authUrl;
}

export function isAuthenticated() {
    accessToken = getAccessToken();
    return !!accessToken;
}

export function logout() {
    accessToken = null;
    setDropboxHash('');
    localStorage.setItem('dropboxAccessToken', '');
}

export async function listDir() {
    const dbx = new Dropbox.Dropbox({ accessToken: getAccessToken() });
    const response = await dbx.filesListFolder({ path: '' });
    return response.result.entries;
}

export async function fileExist(filename) {
    const files = await listDir();
    const file = files && files.find((f) => f.name === filename);
    if (file) {
        return file;
    }
    return false;
}

export async function download(filename) {
    const dbx = new Dropbox.Dropbox({ accessToken: getAccessToken() });

    const response = await dbx.filesDownload({ path: '/' + filename });
    if (response.status !== 200) {
        return null;
    }

    setDropboxHash(response.result.content_hash);

    const fileContent = await response.result.fileBlob.arrayBuffer();

    return fileContent;
}

export async function upload(filename, content) {
    const dbx = new Dropbox.Dropbox({ accessToken: getAccessToken() });

    let response;
    try {
        response = await dbx.filesUpload({
            path: '/' + filename,
            contents: content,
            mode: 'overwrite',
        });
    } catch (error) {
        console.error(error);
        return false;
    }

    setDropboxHash(response.result.content_hash);

    return response && response.status === 200;
}

export function getAccessToken() {
    const accessTokenFromUrl = getAccessTokenFromUrl();
    if (accessTokenFromUrl) {
        localStorage.setItem('dropboxAccessToken', accessTokenFromUrl);
        return accessTokenFromUrl;
    }
    return localStorage.getItem('dropboxAccessToken');
}

export function getAccessTokenFromUrl() {
    const url = window.location.hash;
    if (!url) {
        return null;
    }
    const parameters = url.split('&');
    let accessTokenParam = parameters.find((p) => p.includes('access_token='));
    if (!accessTokenParam) {
        return null;
    }
    accessTokenParam = accessTokenParam.split('=');
    const accessToken =
        accessTokenParam && accessTokenParam.length === 2 ? accessTokenParam[1] : null;
    window.location.hash = '';
    return accessToken && accessToken.length ? accessToken : null;
}

export function setDropboxHash(hash) {
    window.localStorage.setItem('dropboxHash', hash);
}

export function getDropboxHash(hash) {
    return window.localStorage.getItem('dropboxHash');
}

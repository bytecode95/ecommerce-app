const authRoot = 'authorization';
const applicationRoot = 'application';


export const Routes = {
    version1: 'v1',
    auth: {
        root: authRoot,
        signIn: `/${authRoot}/sign-in`,
        refreshToken: `/${authRoot}/refresh-token`,
    },
    app: {
        root: applicationRoot,
        files: `/${applicationRoot}/objects`,
    },

};
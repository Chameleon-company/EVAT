
export const ConfigData = ()=>{

    const MODE = {
        DEV: "dev",
        PROD: "prod",
    }
    
    const mode = MODE.PROD;
    
    const backend = {
        ipAddress: "http://10.0.2.2",
        port: 8080,
        devIPAddress: "http://10.0.2.2",
        devPort: 8080,
    }

    const backendURL = (mode)=>{
        return mode === MODE.DEV 
        ? `${backend.devIPAddress}:${backend.devPort}` 
        : `${backend.ipAddress}:${backend.port}`
    }

    return {
        backend,
        MODE,
        backendURL,
        mode
    }
} 


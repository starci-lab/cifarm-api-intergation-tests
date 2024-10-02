import { Client } from "@heroiclabs/nakama-js";

export const config = () => ({
    fakeSignatureUrl: "http://localhost:9999/api/v1/authenticator/fake-signature",
    nakama: {
        serverkey: "defaultkey",
        host: "localhost",
        port: "7350",
        ssl: false,
    }
})


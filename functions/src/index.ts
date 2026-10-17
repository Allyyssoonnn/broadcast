import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions";

initializeApp();
setGlobalOptions({region: "southamerica-east1", maxInstances: 5});

export {cascadeDelete} from "./cascadeDelete";
export {createMessage} from "./createMessage";
export {deleteContact} from "./deleteContact";
export {sendScheduledMessages} from "./sendScheduled";
export {updateMessage} from "./updateMessage";

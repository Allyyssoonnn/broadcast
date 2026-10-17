import { useState } from "react";
import ConnectionSelector from "../features/connections/components/connection.selector";
import ContactManager from "../features/contacts/components/contact.manager";
import MessageManager from "../features/messages/components/message.manager";

export default function BroadcastPage() {
   const [connectionSelected, setConnectionSelected] = useState<string | null>(null);

   const onConnectionSelected = (connectionId: string | null) => setConnectionSelected(connectionId);

   return (
      <>
         <div className="mx-auto grid gap-4 p-4 md:grid-cols-2">
            <ConnectionSelector connectionSelected={connectionSelected} onConnectionSelected={onConnectionSelected} />
            <ContactManager key={connectionSelected} connectionId={connectionSelected} />
         </div>

         <div className="mx-auto grid gap-4 p-4">
            <MessageManager key={connectionSelected} connectionSelected={connectionSelected} />
         </div>
      </>
   );
}

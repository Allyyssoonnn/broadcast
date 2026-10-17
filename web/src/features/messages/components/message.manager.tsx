import MessageHistory from "./message.history";
import MessageSender from "./message.sender";

export type MessageManagerProps = {
   connectionSelected: string | null;
};

export default function MessageManager({ connectionSelected }: MessageManagerProps) {
   return (
      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
         <MessageSender connectionSelected={connectionSelected} />
         <MessageHistory connectionSelected={connectionSelected} />
      </div>
   );
}

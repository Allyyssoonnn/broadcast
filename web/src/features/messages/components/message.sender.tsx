import { Alert, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { useAuth } from "../../auth/hooks";
import ContactSelector from "../../contacts/components/contact.selector";
import { createMessage } from "../api";

export type MessageSenderProps = {
   connectionSelected: string | null;
};

export default function MessageSender({ connectionSelected }: MessageSenderProps) {
   const { user } = useAuth();

   const [content, setContent] = useState("");
   const [scheduledAt, setScheduledAt] = useState<Dayjs | null>(null);
   const [recipientIds, setRecipientIds] = useState<string[]>([]);
   const [formError, setFormError] = useState("");
   const [sending, setSending] = useState(false);

   const submit = async (schedule: boolean) => {
      if (!user?.uid) return;

      if (!connectionSelected) return setFormError("Select a connection first.");
      if (recipientIds.length === 0) return setFormError("Select at least one contact.");
      if (!content.trim()) return setFormError("Type a message.");

      if (schedule && (!scheduledAt || !scheduledAt.isValid() || !scheduledAt.isAfter(dayjs()))) {
         return setFormError("Choose a future date and time.");
      }

      try {
         setFormError("");
         setSending(true);
         await createMessage(connectionSelected, {
            content,
            contactIds: recipientIds,
            scheduledAt: schedule ? scheduledAt!.toDate() : null,
         });
         setContent("");
         setRecipientIds([]);
         setScheduledAt(null);
      } catch (err) {
         setFormError(err instanceof Error ? err.message : "Could not create the message.");
      } finally {
         setSending(false);
      }
   };

   return (
      <Paper variant="outlined" className="p-4">
         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            MESSAGE
         </Typography>

         <ContactSelector connectionId={connectionSelected} selectedIds={recipientIds} onChange={setRecipientIds} />

         <div className="my-4">
            <TextField
               placeholder="Type your message"
               multiline
               rows={5}
               fullWidth
               value={content}
               onChange={(event) => setContent(event.target.value)}
               slotProps={{ htmlInput: { maxLength: 1000 } }}
               helperText={`${content.length}/1000`}
            />
         </div>

         <div className="mb-4">
            <DateTimePicker
               ampm={false}
               label="Schedule date and time"
               value={scheduledAt}
               onChange={setScheduledAt}
               minDateTime={dayjs()}
               slotProps={{
                  textField: { fullWidth: true, size: "small" },
               }}
            />
         </div>

         {formError && (
            <Alert severity="error" className="mb-2" onClose={() => setFormError("")}>
               {formError}
            </Alert>
         )}

         <div className="flex flex-wrap justify-end gap-3">
            <Button
               color="success"
               variant="outlined"
               size="large"
               disabled={!content.trim() || sending}
               onClick={() => submit(true)}
            >
               {sending ? <CircularProgress size={20} color="inherit" /> : "Schedule"}
            </Button>

            <Button
               color="success"
               variant="contained"
               size="large"
               disabled={!content.trim() || sending}
               onClick={() => submit(false)}
            >
               {sending ? <CircularProgress size={20} color="inherit" /> : "Send now"}
            </Button>
         </div>
      </Paper>
   );
}

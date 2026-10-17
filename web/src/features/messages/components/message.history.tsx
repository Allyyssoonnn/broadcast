import {
   Alert,
   Button,
   Chip,
   CircularProgress,
   Dialog,
   DialogActions,
   DialogContent,
   DialogTitle,
   List,
   ListItem,
   Paper,
   TextField,
   ToggleButton,
   ToggleButtonGroup,
   Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import ContactSelector from "../../contacts/components/contact.selector";
import { deleteMessage, updateMessage } from "../api";
import { useMessages } from "../hooks";
import type { Message, MessageStatus } from "../types";

type Filter = "all" | MessageStatus;

export type MessageHistoryProps = {
   connectionSelected: string | null;
};

const shortMessage = (msg: string) => (msg.length > 150 ? `${msg.slice(0, 150)}...` : msg);

const formatDate = (message: Message) => {
   const ts = message.status === "sent" ? message.sentAt : message.scheduledAt;
   return ts ? dayjs(ts.toDate()).format("DD/MM/YYYY HH:mm") : "";
};

const createdMillis = (message: Message) => message.createdAt?.toMillis() ?? Date.now();

export default function MessageHistory({ connectionSelected }: MessageHistoryProps) {
   const { messages, loading, error } = useMessages(connectionSelected);

   const [filter, setFilter] = useState<Filter>("all");
   const [editing, setEditing] = useState<Message | null>(null);
   const [editContent, setEditContent] = useState("");
   const [editDate, setEditDate] = useState<Dayjs | null>(null);
   const [saving, setSaving] = useState(false);
   const [actionError, setActionError] = useState("");
   const [editRecipientIds, setEditRecipientIds] = useState<string[]>([]);

   if (!connectionSelected) {
      return (
         <Paper variant="outlined" className="p-4">
            <Typography variant="body2" color="text.secondary">
               Select a connection to see its messages.
            </Typography>
         </Paper>
      );
   }

   const visible = messages
      .filter((m) => filter === "all" || m.status === filter)
      .sort((a, b) => createdMillis(b) - createdMillis(a));

   const startEdit = (message: Message) => {
      setActionError("");
      setEditing(message);
      setEditContent(message.content);
      setEditRecipientIds(message.contactIds);
      setEditDate(message.scheduledAt ? dayjs(message.scheduledAt.toDate()) : null);
   };

   const handleSave = async () => {
      if (!editing) return;

      if (editRecipientIds.length === 0) {
         setActionError("Select at least one contact.");
         return;
      }

      if (!editDate || !editDate.isValid() || !editDate.isAfter(dayjs())) {
         setActionError("Choose a future date and time.");
         return;
      }

      try {
         setActionError("");
         setSaving(true);
         await updateMessage(editing.id, {
            content: editContent,
            contactIds: editRecipientIds,
            scheduledAt: editDate.toDate(),
         });
         setEditing(null);
      } catch (err) {
         setActionError(err instanceof Error ? err.message : "Could not update the message.");
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async (messageId: string) => {
      if (!window.confirm("Delete this message?")) return;
      try {
         await deleteMessage(messageId);
      } catch {
         setActionError("Could not delete the message.");
      }
   };

   return (
      <Paper variant="outlined" className="p-4">
         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            HISTORY
         </Typography>

         <ToggleButtonGroup
            exclusive
            size="small"
            value={filter}
            onChange={(_, value: Filter | null) => value && setFilter(value)}
         >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="sent">Sent</ToggleButton>
            <ToggleButton value="scheduled">Scheduled</ToggleButton>
         </ToggleButtonGroup>

         {(error || actionError) && !editing && (
            <Alert severity="error" className="mt-2" onClose={() => setActionError("")}>
               {actionError || error}
            </Alert>
         )}

         <List>
            {loading && (
               <div className="flex justify-center my-10">
                  <CircularProgress />
               </div>
            )}

            {visible.length === 0 && !loading && (
               <div className="flex justify-center py-3">
                  <Typography variant="body2" color="text.secondary">
                     No messages found
                  </Typography>
               </div>
            )}

            {visible.map((message) => (
               <ListItem
                  key={message.id}
                  divider
                  className="pr-36!"
                  secondaryAction={
                     <div className="flex gap-1">
                        {message.status === "scheduled" && (
                           <Button size="small" onClick={() => startEdit(message)}>
                              Edit
                           </Button>
                        )}

                        <Button size="small" color="error" onClick={() => handleDelete(message.id)}>
                           Delete
                        </Button>
                     </div>
                  }
               >
                  <div className="flex flex-col items-start gap-1">
                     <Chip
                        size="small"
                        label={message.status === "sent" ? "Sent" : "Scheduled"}
                        color={message.status === "sent" ? "success" : "warning"}
                     />
                     <Typography variant="body2">{shortMessage(message.content)}</Typography>
                     <Typography variant="caption" color="text.secondary">
                        {formatDate(message)} · {message.contactIds.length} recipient(s)
                     </Typography>
                  </div>
               </ListItem>
            ))}
         </List>

         <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
            <DialogTitle>Edit scheduled message</DialogTitle>

            <DialogContent className="flex flex-col gap-4 pt-2!">
               <ContactSelector
                  connectionId={connectionSelected}
                  selectedIds={editRecipientIds}
                  onChange={setEditRecipientIds}
               />

               <TextField
                  multiline
                  rows={4}
                  fullWidth
                  label="Message"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  slotProps={{ htmlInput: { maxLength: 1000 } }}
                  helperText={`${editContent.length}/1000`}
               />

               <DateTimePicker
                  ampm={false}
                  label="Schedule date and time"
                  value={editDate}
                  onChange={setEditDate}
                  minDateTime={dayjs()}
                  slotProps={{ textField: { fullWidth: true } }}
               />
               {actionError && <Alert severity="error">{actionError}</Alert>}
            </DialogContent>

            <DialogActions>
               <Button color="inherit" onClick={() => setEditing(null)}>
                  Cancel
               </Button>

               <Button variant="contained" onClick={handleSave} disabled={saving}>
                  Save
               </Button>
            </DialogActions>
         </Dialog>
      </Paper>
   );
}

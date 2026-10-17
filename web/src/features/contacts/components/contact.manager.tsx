import {
   Alert,
   Button,
   CircularProgress,
   List,
   ListItem,
   ListItemText,
   Paper,
   TextField,
   Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../auth/hooks";
import { createContact, deleteContact, updateContact } from "../api";
import { useContacts } from "../hooks";

export type ContactManagerProps = {
   connectionId: string | null;
};

export default function ContactManager({ connectionId }: ContactManagerProps) {
   const { user } = useAuth();
   const { contacts, loading, error } = useContacts(connectionId);
   const [saving, setSaving] = useState(false);

   const [name, setName] = useState("");
   const [phone, setPhone] = useState("");
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editName, setEditName] = useState("");
   const [editPhone, setEditPhone] = useState("");
   const [formError, setFormError] = useState("");

   if (!connectionId) {
      return (
         <Paper variant="outlined" className="p-4">
            <div className="flex justify-center py-3">
               <Typography variant="body2" color="text.secondary">
                  Select a connection to manage its contacts.
               </Typography>
            </div>
         </Paper>
      );
   }

   const handleCreate = async () => {
      if (!user?.uid) return;

      try {
         setFormError("");
         setSaving(true);
         await createContact(user.uid, connectionId, { name, phone });
         setName("");
         setPhone("");
      } catch (err) {
         setFormError(err instanceof Error ? err.message : "Could not create the contact.");
      } finally {
         setSaving(false);
      }
   };

   const startEdit = (id: string, currentName: string, currentPhone: string) => {
      setEditingId(id);
      setEditName(currentName);
      setEditPhone(currentPhone);
   };

   const handleUpdate = async () => {
      if (!editingId) return;
      try {
         setFormError("");
         await updateContact(editingId, { name: editName, phone: editPhone });
         setEditingId(null);
      } catch (err) {
         setFormError(err instanceof Error ? err.message : "Could not update the contact");
      }
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm("Delete this contact? Scheduled messages with no remaining recipients will be deleted"))
         return;
      try {
         await deleteContact(id);
      } catch {
         setFormError("Could not delete the contact.");
      }
   };

   return (
      <Paper variant="outlined" className="p-4">
         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            CONTACTS
         </Typography>

         <div className="my-4 flex flex-col gap-2 sm:flex-row">
            <TextField size="small" fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />

            <TextField
               size="small"
               fullWidth
               label="Phone"
               value={phone}
               onChange={(e) => setPhone(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            <Button variant="contained" onClick={handleCreate} disabled={saving}>
               {saving ? <CircularProgress size={20} color="inherit" /> : "Add"}
            </Button>
         </div>

         {(formError || error) && (
            <Alert severity="error" className="mb-2" onClose={() => setFormError("")}>
               {formError || error}
            </Alert>
         )}

         <List dense disablePadding>
            {loading && (
               <div className="flex justify-center my-10">
                  <CircularProgress />
               </div>
            )}

            {contacts.length === 0 && !loading && (
               <div className="flex justify-center py-3">
                  <Typography variant="body2" color="text.secondary">
                     No contacts found
                  </Typography>
               </div>
            )}

            {contacts.map((c) =>
               editingId === c.id ? (
                  <li key={c.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
                     <TextField
                        size="small"
                        fullWidth
                        autoFocus
                        label="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                     />
                     <TextField
                        size="small"
                        fullWidth
                        label="Phone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                     />
                     <div className="flex gap-1">
                        <Button size="small" onClick={handleUpdate}>
                           Save
                        </Button>
                        <Button size="small" color="inherit" onClick={() => setEditingId(null)}>
                           Cancel
                        </Button>
                     </div>
                  </li>
               ) : (
                  <ListItem
                     key={c.id}
                     divider
                     className="pr-36!"
                     secondaryAction={
                        <div className="flex gap-1">
                           <Button size="small" onClick={() => startEdit(c.id, c.name, c.phone)}>
                              Edit
                           </Button>
                           <Button size="small" color="error" onClick={() => handleDelete(c.id)}>
                              Delete
                           </Button>
                        </div>
                     }
                  >
                     <ListItemText primary={c.name} secondary={c.phone} />
                  </ListItem>
               ),
            )}
         </List>
      </Paper>
   );
}

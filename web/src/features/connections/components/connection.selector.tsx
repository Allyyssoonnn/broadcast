import {
   Alert,
   Button,
   CircularProgress,
   List,
   ListItem,
   ListItemButton,
   ListItemText,
   Paper,
   TextField,
   Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../auth/hooks";
import { createConnection, deleteConnection, updateConnection } from "../api";
import { useConnections } from "../hooks";

export type ConnectionSelectorProps = {
   connectionSelected: string | null;
   onConnectionSelected: (connectionId: string | null) => void;
};

export default function ConnectionSelector({ connectionSelected, onConnectionSelected }: ConnectionSelectorProps) {
   const { user } = useAuth();
   const { connections, loading, error } = useConnections();

   const [name, setName] = useState("");
   const [editingId, setEditingId] = useState<string | null>(null);
   const [editName, setEditName] = useState("");
   const [formError, setFormError] = useState("");
   const [saving, setSaving] = useState(false);

   const handleCreate = async (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!user?.uid) return;

      const trimmedName = name.trim();
      if (!trimmedName) {
         setFormError("Enter the name for the new connection");
         return;
      }

      try {
         setFormError("");
         setSaving(true);
         await createConnection(user.uid, { name: trimmedName });
         setName("");
      } catch (err) {
         setFormError(err instanceof Error ? err.message : "Could not create the connection");
      } finally {
         setSaving(false);
      }
   };

   const startEdit = (id: string, current: string) => {
      setEditingId(id);
      setEditName(current);
      setFormError("");
   };

   const handleRename = async (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = editName.trim();
      if (!editingId || !trimmedName) {
         setFormError("Enter a connection name");
         return;
      }

      try {
         setFormError("");
         setSaving(true);
         await updateConnection(editingId, { name: trimmedName });
         setEditingId(null);
      } catch (err) {
         setFormError(err instanceof Error ? err.message : "Could not update the connection");
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm("Delete this connection, contacts, and messages?")) return;

      try {
         setFormError("");
         await deleteConnection(id);
         if (connectionSelected === id) onConnectionSelected(null);
      } catch (err) {
         setFormError(err instanceof Error ? err.message : "Could not delete the connection");
      }
   };

   return (
      <Paper variant="outlined" className="p-4">
         <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            CONNECTIONS
         </Typography>

         <form onSubmit={handleCreate} className="my-4 flex gap-2">
            <TextField
               size="small"
               fullWidth
               label="New Connection"
               value={name}
               onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" variant="contained" disabled={saving}>
               {saving ? <CircularProgress size={20} color="inherit" /> : "Add"}
            </Button>
         </form>

         {error ||
            (formError && (
               <Alert severity="error" className="mt-2" onClose={() => setFormError("")}>
                  {formError || error}
               </Alert>
            ))}

         <List dense disablePadding>
            {loading && (
               <div className="my-10 flex justify-center">
                  <CircularProgress />
               </div>
            )}

            {connections.length === 0 && !loading && (
               <div className="flex justify-center py-3">
                  <Typography variant="body2" color="text.secondary">
                     No connections found
                  </Typography>
               </div>
            )}

            {connections.map((connection) =>
               editingId === connection.id ? (
                  <li key={connection.id} className="py-1">
                     <form onSubmit={handleRename} className="flex items-center gap-2">
                        <TextField
                           size="small"
                           fullWidth
                           autoFocus
                           label="Connection name"
                           value={editName}
                           onChange={(event) => setEditName(event.target.value)}
                        />
                        <Button type="submit" size="small" disabled={saving}>
                           Save
                        </Button>
                        <Button
                           type="button"
                           size="small"
                           color="inherit"
                           disabled={saving}
                           onClick={() => setEditingId(null)}
                        >
                           Cancel
                        </Button>
                     </form>
                  </li>
               ) : (
                  <ListItem
                     key={connection.id}
                     disablePadding
                     secondaryAction={
                        <div className="flex gap-1">
                           <Button size="small" onClick={() => startEdit(connection.id, connection.name)}>
                              Edit
                           </Button>
                           <Button size="small" color="error" onClick={() => handleDelete(connection.id)}>
                              Delete
                           </Button>
                        </div>
                     }
                  >
                     <ListItemButton
                        selected={connectionSelected === connection.id}
                        onClick={() => onConnectionSelected(connection.id)}
                        className="pr-36"
                     >
                        <ListItemText primary={connection.name} />
                     </ListItemButton>
                  </ListItem>
               ),
            )}
         </List>
      </Paper>
   );
}

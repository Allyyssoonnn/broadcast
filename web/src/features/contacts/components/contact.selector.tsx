import {
   Alert,
   Checkbox,
   CircularProgress,
   FormControlLabel,
   List,
   ListItem,
   ListItemButton,
   ListItemIcon,
   ListItemText,
   Typography,
} from "@mui/material";
import { useContacts } from "../hooks";

export type ContactSelectorProps = {
   connectionId: string | null;
   selectedIds: string[];
   onChange: (ids: string[]) => void;
};

export default function ContactSelector({ connectionId, selectedIds, onChange }: ContactSelectorProps) {
   const { contacts, loading, error } = useContacts(connectionId);

   if (!connectionId) {
      return (
         <Typography variant="body2" color="text.secondary">
            Select a connection to choose recipients.
         </Typography>
      );
   }

   if (error) {
      return (
         <div className="flex justify-center my-4">
            <Alert severity="error" className="mt-2">
               {error}
            </Alert>
         </div>
      );
   }

   if (loading) {
      return (
         <div className="flex justify-center my-4">
            <CircularProgress size={24} />
         </div>
      );
   }

   if (contacts.length === 0) {
      return (
         <Typography variant="body2" color="text.secondary">
            This connection has no contacts yet.
         </Typography>
      );
   }

   const allSelected = selectedIds.length === contacts.length;
   const someSelected = selectedIds.length > 0 && !allSelected;

   const toggleAll = () => onChange(allSelected ? [] : contacts.map((c) => c.id));

   const toggleOne = (id: string) =>
      onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

   return (
      <div>
         <div className="flex items-center justify-between">
            <FormControlLabel
               label="Select all"
               control={
                  <Checkbox size="small" checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
               }
            />
            <Typography variant="caption" color="text.secondary">
               {selectedIds.length} of {contacts.length} selected
            </Typography>
         </div>

         <List dense disablePadding className="max-h-48 overflow-auto rounded border border-gray-200">
            {contacts.map((c) => (
               <ListItem key={c.id} disablePadding divider>
                  <ListItemButton onClick={() => toggleOne(c.id)}>
                     <ListItemIcon className="min-w-0 mr-2">
                        <Checkbox
                           edge="start"
                           size="small"
                           tabIndex={-1}
                           disableRipple
                           checked={selectedIds.includes(c.id)}
                        />
                     </ListItemIcon>
                     <ListItemText primary={c.name} secondary={c.phone} />
                  </ListItemButton>
               </ListItem>
            ))}
         </List>
      </div>
   );
}

import AccountCircle from "@mui/icons-material/AccountCircle";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { logout } from "../../features/auth/api";
import { useAuth } from "../../features/auth/hooks";

export default function AppHeader() {
   const { user } = useAuth();
   const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

   const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
   };

   const handleClose = () => {
      setAnchorEl(null);
   };

   return (
      <Box sx={{ flexGrow: 1 }}>
         <AppBar position="static" color="success">
            <Toolbar>
               <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  BroadCast
               </Typography>

               {user?.uid && (
                  <div className="flex items-center gap-3">
                     <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {user?.email}
                     </Typography>

                     <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                     >
                        <AccountCircle />
                     </IconButton>

                     <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                           vertical: "top",
                           horizontal: "right",
                        }}
                        keepMounted
                        transformOrigin={{
                           vertical: "top",
                           horizontal: "right",
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                     >
                        <MenuItem onClick={logout}>Log Out</MenuItem>
                     </Menu>
                  </div>
               )}
            </Toolbar>
         </AppBar>
      </Box>
   );
}

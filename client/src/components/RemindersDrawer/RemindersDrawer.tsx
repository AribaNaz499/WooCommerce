import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import { COLORS } from "../../constant/color";
import { Close } from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import LandingButton from "../LandingButton/LandingButton";

const RemindersDrawer = () => {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

  const openGoogleCalendar = () => {
    // You can later replace these with real selected event details
    const title = "DIY Personalisation";
    const details = "Create your personalised design in time — don’t leave it last minute!";
    const location = "DIY Personalisation";

    // Optional: Set a default date/time (example: tomorrow 9am for 1 hour)
    // Google expects YYYYMMDDTHHMMSSZ (UTC) OR without Z for local-ish
    // If you don’t want date/time, remove &dates=... completely
    // const start = "20260103T090000Z";
    // const end = "20260103T100000Z";

    const url =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(title)}` +
      `&details=${encodeURIComponent(details)}` +
      `&location=${encodeURIComponent(location)}`;
      // + `&dates=${start}/${end}`;

    setOpen(false); // ✅ actually closes drawer
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const DrawerList = (
    <Box sx={{ width: 350, p: 2 }} role="presentation">
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {/* ✅ Close only on this button */}
        <IconButton onClick={toggleDrawer(false)}>
          <Close />
        </IconButton>
      </Box>

      <Divider />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
          height: "60vh",
          textAlign: "center",
          mt: 6,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          component={"img"}
          src="/assets/icons/reminder-calender.svg"
          sx={{ width: 130, height: 130 }}
        />

        <Typography sx={{ fontSize: "24px", fontWeight: 700, pb: 1 }}>
          Set a reminder
        </Typography>

        <Typography sx={{ maxWidth: 360 }}>
          Add an event to your Google Calendar so you never miss birthdays, anniversaries, or special occasions again.
        </Typography>

        <LandingButton
          title="Set Reminder"
          width="300px"
          personal
          onClick={openGoogleCalendar}
        />
      </Box>
    </Box>
  );

  return (
    <div>
      <IconButton
        onClick={toggleDrawer(true)}
        sx={{
          ...iconStyle,
          display: { lg: "flex", md: "flex", sm: "none", xs: "none" },
        }}
      >
        <Box
          component="img"
          src="/assets/icons/Reminders.svg"
          sx={{ width: 35, height: 35 }}
        />
        <Typography fontSize="12px">Reminders</Typography>
      </IconButton>

      <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
      </Drawer>
    </div>
  );
};

export default RemindersDrawer;

const iconStyle = {
  color: COLORS.black,
  flexDirection: "column",
  "&:hover": {
    color: COLORS.primary,
    bgcolor: "transparent",
  },
};

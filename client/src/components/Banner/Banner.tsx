// import { Box, Typography } from "@mui/material";
// import { COLORS } from "../../constant/color";
// import LandingButton from "../LandingButton/LandingButton";

// const Banner = () => {
//   return (
//     <Box
//       sx={{
//         height: { md: "500px", sm: "500px", xs: "50vh" },
//         width: "100%",
//         position: "relative",
//         overflow: "hidden",
//         mt: { md: 10, sm: 10, xs: 0 },
//         borderRadius: 3,
//       }}
//     >
//       {/* Animated Image up and down*/}
//       <Box
//         component="img"
//         src="/assets/images/animated-banner.jpg"
//         alt="animated ImG"
//         sx={{
//           display: { md: 'none', sm: 'none', xs: 'block' },
//           width: "100%",
//           height: "100%",
//           objectFit: "cover",
//           filter: "brightness(80%)",
//         }}
//       />
//       <Box
//         component="img"
//         src="/assets/images/animated-banner.jpg"
//         alt="animated ImG"
//         className="panning-img"
//         sx={{
//           display: { md: 'block', sm: 'block', xs: 'none' },
//           width: "100%",
//           height: "100%",
//           objectFit: "cover",
//           filter: "brightness(80%)",
//         }}
//       />

//       {/* Black gradient overlay */}
//       <Box
//         sx={{
//           position: "absolute",
//           bottom: 0,
//           left: 0,
//           width: "100%",
//           height: "50%",
//           background:
//             "linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0,0,0,0))",
//         }}
//       />

//       <Box
//         sx={{
//           position: "absolute",
//           bottom: { md: "18%", sm: "20%", xs: 0 },
//           color: COLORS.white,
//           p: 2,
//           left: { md: "2%", sm: 0, xs: '0%' },
//         }}
//       >
//         <Typography
//           sx={{
//             fontSize: {
//               md: "40px",
//               sm: "35px",
//               xs: "23px",
//               fontWeight: 800,
//               width: "100%",
//             },
//           }}
//         >
//           The power to personalise, in your hands
//         </Typography>
//         <Typography
//           sx={{
//             fontSize: {
//               md: "20px",
//               sm: "",
//               xs: "15px",
//               width: "70%",
//             },
//           }}
//         >
//           Edit any design, download your printable PDF, and make thoughtful cards, invites, clothing,
//           mugs, décor and more from home. Easy, fast and affordable
//         </Typography>

//         <Box
//           sx={{
//             display: { md: "flex", sm: "flex", xs: "block" },
//             gap: "10px",
//             flexWrap: "wrap",
//             width: { md: "50%", sm: "70%", xs: "100%" },
//             mt: { md: 5, sm: 3, xs: 1 },
//           }}
//         >
//           <LandingButton title="For Her" width="250px" personal active />
//           <LandingButton title="For Him" width="250px" personal />
//           <LandingButton title="Kids Birthday" width="250px" personal />
//           <LandingButton title="All Birthday" width="250px" personal />
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default Banner;

import { Box, Typography } from "@mui/material";
import { COLORS } from "../../constant/color";

const Banner = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography
        sx={{
          fontSize: { md: 35, sm: 30, xs: 20 },
          fontWeight: 600,
          color: COLORS.green,
          lineHeight: 1.3,
          textAlign: "center",
          mb: 1,
        }}
      >
        The Power to Personalise in your hands.
      </Typography>

      <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", mb: 2 }}>
        Personalised printable cards, invites and gifts you can create and print at home.
      </Typography>

      <Box
        sx={{
          display: "flex",
          width: "100%",
          gap: { md: 3, xs: 2 },
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: COLORS.green,
          height: { md: 300, xs: "auto" },
          p: { md: 3, xs: 2 },
          flexDirection: { xs: "column", sm: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
      {/* Left Side */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { md: 30, sm: 22, xs: 18 },
              // fontWeight: 600,
              color: COLORS.white,
              lineHeight: 1.25,
            }}
          >
            Edit any design, personalise it your way, and receive a higher resolution print ready file instantly.
            <br />
            Create at home your own thoughtful cards, invites, gifts and more, with no delivery, no waiting and low
            prices.
          </Typography>
        </Box>

        {/* Right Side */}
        <Box
          sx={{
            width: { xs: "100%", md: 520 }, // fixed stage width on desktop
            height: { xs: 180, md: "100%" },
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-end" },
            gap: { md: 3, xs: 2 },
          }}
        >

           <Box
          component={'img'}
          src="/assets/images/Banner.jpg"
          sx={{
            width: '100%',
            height: 'auto',
            borderRadius:2
          }}
        />
          {/* Left big (poster) */}
          {/* <Box
            sx={{
              height: { xs: 160, md: 240 },
              width: { xs: 120, md: 160 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="/assets/images/headA4.png"
              alt="poster"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.25))",
              }}
            />
          </Box> */}

          {/* Mug smaller */}
          {/* <Box
            sx={{
              height: { xs: 120, md: 150 }, // smaller than others
              width: { xs: 120, md: 150 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mt: { xs: 0, md: 1 }, // slight lower like screenshot
            }}
          >
            <Box
              component="img"
              src="/assets/images/mugs.png"
              alt="mug"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.25))",
              }}
            />
          </Box> */}

          {/* Right big (frame) */}
          {/* <Box
            sx={{
              height: { xs: 160, md: 250 },
              width: { xs: 130, md: 170 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="/assets/images/wallart.png"
              alt="wall art"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.25))",
              }}
            />
          </Box> */}
        </Box>
      </Box>
    </Box>
  );
};

export default Banner;
